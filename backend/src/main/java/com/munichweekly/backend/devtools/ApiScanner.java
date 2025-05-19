package com.munichweekly.backend.devtools;

import com.munichweekly.backend.devtools.annotation.Description;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Profile("dev")
public class ApiScanner {

    // List of all controller classes to scan
    private final List<Class<?>> controllers = new ArrayList<>(
            ClassScanner.scanForControllers("com.munichweekly.backend.controller")
    );
    public void run() {
        StringBuilder markdown = new StringBuilder("# API Endpoints\n\n");

        for (Class<?> controller : controllers) {
            String basePath = "";
            if (controller.isAnnotationPresent(RequestMapping.class)) {
                basePath = controller.getAnnotation(RequestMapping.class).value()[0];
            }

            markdown.append("## ").append(controller.getSimpleName()).append("\n\n");

            for (Method method : controller.getDeclaredMethods()) {
                String methodPath = "";
                String httpMethod = null;

                if (method.isAnnotationPresent(GetMapping.class)) {
                    methodPath = method.getAnnotation(GetMapping.class).value().length > 0 ?
                            method.getAnnotation(GetMapping.class).value()[0] : "";
                    httpMethod = "GET";
                } else if (method.isAnnotationPresent(PostMapping.class)) {
                    methodPath = method.getAnnotation(PostMapping.class).value().length > 0 ?
                            method.getAnnotation(PostMapping.class).value()[0] : "";
                    httpMethod = "POST";
                } else if (method.isAnnotationPresent(PutMapping.class)) {
                    methodPath = method.getAnnotation(PutMapping.class).value().length > 0 ?
                            method.getAnnotation(PutMapping.class).value()[0] : "";
                    httpMethod = "PUT";
                } else if (method.isAnnotationPresent(DeleteMapping.class)) {
                    methodPath = method.getAnnotation(DeleteMapping.class).value().length > 0 ?
                            method.getAnnotation(DeleteMapping.class).value()[0] : "";
                    httpMethod = "DELETE";
                } else if (AnnotatedElementUtils.isAnnotated(method, RequestMapping.class)) {
                    RequestMapping rm = AnnotatedElementUtils.findMergedAnnotation(method, RequestMapping.class);
                    if (rm != null && rm.method().length > 0) {
                        methodPath = rm.value().length > 0 ? rm.value()[0] : "";
                        httpMethod = rm.method()[0].name();
                    }
                }

                if (httpMethod != null) {
                    markdown.append("- **").append(httpMethod).append("** `")
                            .append(basePath).append(methodPath).append("`\n");
                }

                Description desc = method.getAnnotation(Description.class);
                if (desc != null) {
                    markdown.append("  > ").append(desc.value()).append("\n");
                }

                Parameter[] parameters = method.getParameters();
                if (parameters.length > 0) {
                    String paramList = Arrays.stream(parameters)
                            .map(p -> p.getType().getSimpleName() + " " + p.getName())
                            .collect(Collectors.joining(", "));
                    markdown.append("\n  > **Params**: `").append(paramList).append("`\n");
                }

            }

            markdown.append("\n");
        }
        Path output = Paths.get("docs/api.md"); // ⬅️ 注意不再是 ../docs
        output.toFile().getParentFile().mkdirs(); // 确保目录存在
        // Save to file
        try (FileWriter writer = new FileWriter(String.valueOf(output))) {
            writer.write(markdown.toString());
            System.out.println("✅ API documentation generated at docs/api.md");
        } catch (IOException e) {
            System.err.println("❌ Failed to write API doc: " + e.getMessage());
        }
    }
}