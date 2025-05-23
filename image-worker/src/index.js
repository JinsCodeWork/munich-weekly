/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/**
 * 慕城摄影周刊（Munich Weekly）图片处理Worker
 * 
 * 功能：
 * 1. 接收图片请求并从R2私有存储桶获取原始图片
 * 2. 使用Cloudflare Image Resizing对图片进行缩放和优化
 * 3. 返回处理后的图片，支持各种转换参数
 */

// 图片路径的URL Pattern匹配器
const IMAGE_PATH_PATTERN = new URLPattern({
	pathname: '/uploads/:path*'
});

// 支持的图片转换参数（按照Cloudflare Image Transform文档）
const SUPPORTED_TRANSFORM_PARAMS = [
	'width', 'height', 'fit', 'quality', 'format', 'dpr', 
	'gravity', 'anim', 'compression', 'rotate', 'sharpen',
	'trim', 'background', 'blur', 'brightness', 'contrast',
	'gamma', 'saturation', 'metadata'
];

/**
 * 检查请求是否是有效的图片请求
 * @param {Request} request - 客户端请求
 * @returns {boolean} - 是否是有效的图片请求
 */
function isValidImageRequest(request) {
	return IMAGE_PATH_PATTERN.test(request.url);
}

/**
 * 从请求URL中提取图片参数
 * @param {URL} requestUrl - 请求URL
 * @returns {Object} - 提取的图片参数
 */
function extractImageParams(requestUrl) {
	const params = {};
	
	for (const param of SUPPORTED_TRANSFORM_PARAMS) {
		if (requestUrl.searchParams.has(param)) {
			params[param] = requestUrl.searchParams.get(param);
		}
	}
	
	return params;
}

/**
 * 检测请求的Accept头信息，确定最佳图像格式
 * @param {Request} request - 客户端请求
 * @returns {string|null} - 最佳图像格式
 */
function detectBestImageFormat(request) {
	const accept = request.headers.get('accept') || '';
	
	// 根据用户代理判断是否为移动设备
	const userAgent = request.headers.get('user-agent') || '';
	const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
	
	// 对于移动设备，优先使用WebP而不是AVIF
	// AVIF对大图片有严格限制，可能导致回退到质量更低的JPEG
	if (isMobile && /image\/webp/.test(accept)) {
		return 'webp';
	}
	
	// 桌面设备可以尝试AVIF，但WebP仍然是更安全的选择
	if (/image\/avif/.test(accept)) {
		// 只对小图片使用AVIF，大图片用WebP
		return 'webp'; // 暂时改为WebP以确保质量一致性
	} else if (/image\/webp/.test(accept)) {
		return 'webp';
	}
	
	return null;
}

/**
 * 设置图像处理的默认参数
 * @param {Object} params - 图片参数
 * @param {string|null} detectedFormat - 从Accept头检测到的格式
 * @returns {Object} - 带有默认值的参数
 */
function setDefaultImageParams(params, detectedFormat) {
	const defaultParams = { ...params };
	
	// 优化fit参数的默认处理
	if (!defaultParams.fit) {
		// 如果同时提供了宽度和高度，默认使用contain保持原图比例
		if (defaultParams.width && defaultParams.height) {
			defaultParams.fit = 'contain';
		} else {
			// 如果只提供了一个维度，使用scale-down避免图像被不必要地放大
			defaultParams.fit = 'scale-down';
		}
	}
	
	// 如果format设置为auto或未设置，并且检测到支持的格式，则使用检测到的格式
	if ((!defaultParams.format || defaultParams.format === 'auto') && detectedFormat) {
		defaultParams.format = detectedFormat;
	} else if (!defaultParams.format) {
		defaultParams.format = 'auto';
	}
	
	// 如果设置了宽度但没有设置高度，保持原图宽高比
	if (defaultParams.width && !defaultParams.height) {
		defaultParams.fit = defaultParams.fit || 'scale-down';
	}
	
	// 特殊处理：如果明确指定了cover且同时指定了尺寸，发出警告
	if (defaultParams.fit === 'cover' && defaultParams.width && defaultParams.height) {
		console.warn('使用cover模式可能会裁剪图片内容，建议使用contain模式保持完整图片');
	}
	
	// 强化质量参数处理 - 确保移动端和高质量请求得到最佳处理
	if (['jpeg', 'webp', 'avif'].includes(defaultParams.format) || defaultParams.format === 'auto') {
		if (!defaultParams.quality) {
			// 默认使用非常高的质量
			defaultParams.quality = 95;
		} else {
			// 确保传入的质量参数被正确处理，特别是高质量请求
			const qualityNum = parseInt(defaultParams.quality, 10);
			if (qualityNum >= 95) {
				// 对于高质量请求，确保不被降级
				defaultParams.quality = Math.min(qualityNum, 100);
			} else {
				defaultParams.quality = qualityNum;
			}
		}
	}
	
	// 确保不启用额外的压缩，保持最佳画质
	if (!defaultParams.compression) {
		// 不设置compression参数，使用默认的无损处理
	}
	
	// 针对高DPR设备优化
	if (defaultParams.dpr && parseInt(defaultParams.dpr, 10) > 1) {
		// 对于高DPR设备，确保质量不被自动降级
		if (!params.quality || parseInt(params.quality, 10) < 90) {
			defaultParams.quality = 95; // 强制提高高DPR设备的质量
		}
	}
	
	// 添加调试信息
	console.log('图片处理参数:', {
		original: params,
		processed: defaultParams,
		detectedFormat: detectedFormat
	});
	
	return defaultParams;
}

/**
 * 从R2获取图片
 * @param {string} objectKey - R2中的对象键
 * @param {Object} env - 环境变量和绑定
 * @returns {Promise<Response>} - 图片响应
 */
async function getImageFromR2(objectKey, env) {
	// 从R2存储桶获取图片
	const object = await env.PHOTO_BUCKET.get(objectKey);
	
	if (!object) {
		return new Response('图片未找到 (404 Not Found)', { 
			status: 404,
			headers: {
				'Content-Type': 'text/plain',
				'Cache-Control': 'public, max-age=60' // 缓存404结果一分钟
			}
		});
	}
	
	// 获取图片头信息和内容
	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	
	// 检查并确保Content-Type正确设置
	const contentType = headers.get('content-type');
	if (!contentType || !contentType.startsWith('image/')) {
		// 根据文件扩展名推断Content-Type
		const extension = objectKey.split('.').pop().toLowerCase();
		const mimeTypes = {
			'jpg': 'image/jpeg',
			'jpeg': 'image/jpeg',
			'png': 'image/png',
			'gif': 'image/gif',
			'webp': 'image/webp',
			'avif': 'image/avif',
			'svg': 'image/svg+xml'
		};
		
		if (extension && mimeTypes[extension]) {
			headers.set('Content-Type', mimeTypes[extension]);
		} else {
			// 默认为JPEG
			headers.set('Content-Type', 'image/jpeg');
		}
	}
	
	return new Response(object.body, {
		headers
	});
}

/**
 * 处理图片转换请求
 * @param {Request} request - 客户端请求
 * @param {Object} env - 环境变量和绑定
 * @returns {Promise<Response>} - 处理后的图片响应
 */
async function handleImageRequest(request, env) {
	// 解析请求URL
	const url = new URL(request.url);
	
	// 提取路径部分（移除开头的/）
	let objectKey = url.pathname;
	if (objectKey.startsWith('/')) {
		objectKey = objectKey.substring(1);
	}
	
	// 从请求中提取图片参数
	const imageParams = extractImageParams(url);
	
	// 检测客户端支持的最佳图像格式
	const detectedFormat = detectBestImageFormat(request);
	
	// 获取原始图片
	const originalImage = await getImageFromR2(objectKey, env);
	
	// 如果图片不存在，返回404
	if (originalImage.status === 404) {
		return originalImage;
	}
	
	// 如果没有图片转换参数，直接返回原图
	if (Object.keys(imageParams).length === 0) {
		// 添加基本的缓存控制
		const headers = new Headers(originalImage.headers);
		headers.set('Cache-Control', 'public, max-age=86400'); // 24小时缓存
		
		return new Response(originalImage.body, {
			headers: headers
		});
	}
	
	// 应用默认参数和检测到的格式
	const processedParams = setDefaultImageParams(imageParams, detectedFormat);
	
	// 获取原始图片内容以准备处理
	const imageData = await originalImage.arrayBuffer();
	
	// 创建新的响应用于图像转换
	const transformedResponse = new Response(imageData);
	
	// 设置响应头
	const headers = new Headers(originalImage.headers);
	
	// 确保设置了正确的Content-Type
	const contentType = headers.get('content-type');
	if (!contentType || !contentType.startsWith('image/')) {
		// 根据格式参数或扩展名设置Content-Type
		if (processedParams.format && processedParams.format !== 'auto') {
			const mimeTypes = {
				'jpeg': 'image/jpeg',
				'png': 'image/png',
				'webp': 'image/webp',
				'avif': 'image/avif',
				'gif': 'image/gif'
			};
			
			if (mimeTypes[processedParams.format]) {
				headers.set('Content-Type', mimeTypes[processedParams.format]);
			} else {
				// 根据文件扩展名推断
				const extension = objectKey.split('.').pop().toLowerCase();
				if (extension && mimeTypes[extension]) {
					headers.set('Content-Type', mimeTypes[extension]);
				} else {
					// 默认为JPEG
					headers.set('Content-Type', 'image/jpeg');
				}
			}
		}
	}
	
	// 设置缓存控制头
	headers.set('Cache-Control', 'public, max-age=86400'); // 24小时缓存
	
	// 如果使用自动格式转换，添加Vary头
	if (processedParams.format === 'auto') {
		headers.set('Vary', 'Accept'); // 根据Accept头缓存不同版本
	}
	
	// 创建最终响应并应用Cloudflare图像转换
	return new Response(transformedResponse.body, {
		headers: headers,
		cf: {
			// 将所有处理参数传递给Cloudflare图像处理引擎
			image: processedParams
		}
	});
}

/**
 * 生成健康检查响应
 * @returns {Response} - 健康检查响应
 */
function handleHealthCheck() {
	return new Response(JSON.stringify({
		status: 'ok',
		service: 'Munich Weekly Image Worker',
		timestamp: new Date().toISOString()
	}), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store'
		}
	});
}

export default {
	async fetch(request, env, ctx) {
		try {
			// 健康检查端点
			if (new URL(request.url).pathname === '/health') {
				return handleHealthCheck();
			}
			
			// 调试图片参数端点
			if (new URL(request.url).pathname === '/debug-params') {
				const url = new URL(request.url);
				const imageParams = extractImageParams(url);
				const detectedFormat = detectBestImageFormat(request);
				const processedParams = setDefaultImageParams(imageParams, detectedFormat);
				
				return new Response(JSON.stringify({
					originalParams: imageParams,
					detectedFormat: detectedFormat,
					processedParams: processedParams,
					userAgent: request.headers.get('user-agent'),
					accept: request.headers.get('accept'),
					url: request.url
				}, null, 2), {
					headers: { 'Content-Type': 'application/json' }
				});
			}
			
			// 调试端点，测试R2访问权限
			if (new URL(request.url).pathname === '/debug-auth') {
				try {
					// 尝试获取一个测试对象，并返回结果
					const testPath = 'uploads/issues/1/submissions/2_5_20250519-223537.jpg';
					const testObject = await env.PHOTO_BUCKET.get(testPath);
					
					if (testObject) {
						return new Response(`✅ 成功访问R2存储: ${testPath}`, {
							headers: { 'Content-Type': 'text/plain' }
						});
					} else {
						// 尝试列出存储桶中的对象
						const listed = await env.PHOTO_BUCKET.list({ prefix: 'uploads/', limit: 10 });
						
						if (listed && listed.objects && listed.objects.length > 0) {
							return new Response(`✅ 成功访问R2存储，但找不到测试文件。存储桶中的其他文件：\n${listed.objects.map(obj => obj.key).join('\n')}`, {
								headers: { 'Content-Type': 'text/plain' }
							});
						} else {
							return new Response(`❌ 访问权限正常，但找不到任何文件。请检查存储桶中是否有文件，以及路径格式是否正确。`, {
								headers: { 'Content-Type': 'text/plain' }
							});
						}
					}
				} catch (error) {
					return new Response(`❌ R2访问错误: ${error.message}\n\n详细错误:\n${error.stack || '无堆栈信息'}`, {
						status: 500,
						headers: { 'Content-Type': 'text/plain' }
					});
				}
			}
			
			// 打印请求信息，帮助调试
			if (new URL(request.url).pathname === '/debug-request') {
				const url = new URL(request.url);
				const headers = {};
				for (const [key, value] of request.headers.entries()) {
					headers[key] = value;
				}
				
				return new Response(JSON.stringify({
					url: request.url,
					pathname: url.pathname,
					method: request.method,
					headers: headers
				}, null, 2), {
					headers: { 'Content-Type': 'application/json' }
				});
			}
			
			// 检查是否是有效的图片请求
			if (isValidImageRequest(request)) {
				return handleImageRequest(request, env);
			}
			
			// 对于不符合图片路径的请求，返回错误信息
			return new Response('无效的请求路径。请使用格式: /uploads/...[路径]...?width=X&height=Y', { 
				status: 400,
				headers: {
					'Content-Type': 'text/plain'
				}
			});
		} catch (error) {
			// 记录错误并返回500响应
			console.error('Worker错误:', error);
			return new Response(`处理请求时发生错误: ${error.message}`, { 
				status: 500,
				headers: {
					'Content-Type': 'text/plain'
				}
			});
		}
	},
};
