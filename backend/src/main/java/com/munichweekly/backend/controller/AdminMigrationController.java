package com.munichweekly.backend.controller;

import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.service.ImageDimensionService;
import com.munichweekly.backend.service.SubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Admin-only controller for safe production data migration operations
 * Used to backfill image dimensions for existing submissions
 */
@RestController
@RequestMapping("/api/admin/migration")
@PreAuthorize("hasAuthority('admin')")
public class AdminMigrationController {

    private static final Logger logger = Logger.getLogger(AdminMigrationController.class.getName());
    
    private final SubmissionService submissionService;
    private final ImageDimensionService imageDimensionService;
    
    // Migration state tracking
    private volatile boolean migrationInProgress = false;
    private volatile String migrationStatus = "idle";
    private final AtomicInteger processedCount = new AtomicInteger(0);
    private final AtomicInteger successCount = new AtomicInteger(0);
    private final AtomicInteger errorCount = new AtomicInteger(0);
    private volatile int totalCount = 0;

    // 🔧 新增：重新迁移状态追踪
    private volatile boolean remigrationInProgress = false;
    private volatile String remigrationStatus = "idle";
    private final AtomicInteger remigrationProcessedCount = new AtomicInteger(0);
    private final AtomicInteger remigrationSuccessCount = new AtomicInteger(0);
    private final AtomicInteger remigrationErrorCount = new AtomicInteger(0);
    private volatile int remigrationTotalCount = 0;

    @Autowired
    public AdminMigrationController(SubmissionService submissionService, 
                                   ImageDimensionService imageDimensionService) {
        this.submissionService = submissionService;
        this.imageDimensionService = imageDimensionService;
    }

    /**
     * Get migration status and statistics
     * GET /api/admin/migration/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getMigrationStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("inProgress", migrationInProgress);
        status.put("status", migrationStatus);
        status.put("totalCount", totalCount);
        status.put("processedCount", processedCount.get());
        status.put("successCount", successCount.get());
        status.put("errorCount", errorCount.get());
        
        if (totalCount > 0) {
            double progressPercentage = (processedCount.get() * 100.0) / totalCount;
            status.put("progressPercentage", Math.round(progressPercentage * 100.0) / 100.0);
        } else {
            status.put("progressPercentage", 0.0);
        }
        
        return ResponseEntity.ok(status);
    }

    // 🔧 新增：获取重新迁移状态
    /**
     * Get remigration status and statistics
     * GET /api/admin/migration/remigration/status
     */
    @GetMapping("/remigration/status")
    public ResponseEntity<Map<String, Object>> getRemigrationStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("inProgress", remigrationInProgress);
        status.put("status", remigrationStatus);
        status.put("totalCount", remigrationTotalCount);
        status.put("processedCount", remigrationProcessedCount.get());
        status.put("successCount", remigrationSuccessCount.get());
        status.put("errorCount", remigrationErrorCount.get());
        
        if (remigrationTotalCount > 0) {
            double progressPercentage = (remigrationProcessedCount.get() * 100.0) / remigrationTotalCount;
            status.put("progressPercentage", Math.round(progressPercentage * 100.0) / 100.0);
        } else {
            status.put("progressPercentage", 0.0);
        }
        
        return ResponseEntity.ok(status);
    }

    /**
     * Analyze submissions that need dimension migration
     * GET /api/admin/migration/analyze
     */
    @GetMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyzeSubmissions() {
        try {
            logger.info("Starting submission analysis for dimension migration");
            
            List<Submission> allSubmissions = submissionService.getAllSubmissionEntities();
            int totalSubmissions = allSubmissions.size();
            
            long submissionsWithDimensions = allSubmissions.stream()
                .filter(s -> s.getImageWidth() != null && s.getImageHeight() != null && s.getAspectRatio() != null)
                .count();
                
            long submissionsNeedingMigration = totalSubmissions - submissionsWithDimensions;
            
            Map<String, Object> analysis = new HashMap<>();
            analysis.put("totalSubmissions", totalSubmissions);
            analysis.put("submissionsWithDimensions", submissionsWithDimensions);
            analysis.put("submissionsNeedingMigration", submissionsNeedingMigration);
            analysis.put("migrationRequired", submissionsNeedingMigration > 0);
            
            if (totalSubmissions > 0) {
                double optimizationPercentage = (submissionsWithDimensions * 100.0) / totalSubmissions;
                analysis.put("currentOptimizationPercentage", Math.round(optimizationPercentage * 100.0) / 100.0);
            } else {
                analysis.put("currentOptimizationPercentage", 100.0);
            }
            
            logger.info(String.format("Analysis complete: %d total, %d with dimensions, %d need migration", 
                       totalSubmissions, submissionsWithDimensions, submissionsNeedingMigration));
            
            return ResponseEntity.ok(analysis);
            
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error analyzing submissions for migration", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to analyze submissions: " + e.getMessage()));
        }
    }

    /**
     * Start safe batch migration of submission dimensions
     * POST /api/admin/migration/start
     * 
     * @param batchSize Number of submissions to process in each batch (default: 5)
     * @param delayMs Delay between batches in milliseconds (default: 2000)
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startMigration(
            @RequestParam(value = "batchSize", defaultValue = "5") int batchSize,
            @RequestParam(value = "delayMs", defaultValue = "2000") int delayMs) {
        
        if (migrationInProgress || remigrationInProgress) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Migration or remigration already in progress"));
        }
        
        // Validate parameters
        if (batchSize < 1 || batchSize > 20) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Batch size must be between 1 and 20"));
        }
        
        if (delayMs < 1000 || delayMs > 30000) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Delay must be between 1000ms and 30000ms"));
        }
        
        try {
            // Start migration asynchronously
            CompletableFuture.runAsync(() -> executeMigration(batchSize, delayMs));
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Migration started successfully");
            response.put("batchSize", batchSize);
            response.put("delayMs", delayMs);
            response.put("status", "starting");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error starting migration", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to start migration: " + e.getMessage()));
        }
    }

    // 🔧 新增：启动重新迁移
    /**
     * Start safe batch remigration of ALL submission dimensions (including existing ones)
     * POST /api/admin/migration/remigration/start
     * 
     * @param batchSize Number of submissions to process in each batch (default: 3)
     * @param delayMs Delay between batches in milliseconds (default: 3000)
     */
    @PostMapping("/remigration/start")
    public ResponseEntity<Map<String, Object>> startRemigration(
            @RequestParam(value = "batchSize", defaultValue = "3") int batchSize,
            @RequestParam(value = "delayMs", defaultValue = "3000") int delayMs) {
        
        if (migrationInProgress || remigrationInProgress) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Migration or remigration already in progress"));
        }
        
        // Validate parameters - stricter limits for remigration
        if (batchSize < 1 || batchSize > 10) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Remigration batch size must be between 1 and 10"));
        }
        
        if (delayMs < 2000 || delayMs > 30000) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Remigration delay must be between 2000ms and 30000ms"));
        }
        
        try {
            // Start remigration asynchronously
            CompletableFuture.runAsync(() -> executeRemigration(batchSize, delayMs));
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Remigration started successfully");
            response.put("batchSize", batchSize);
            response.put("delayMs", delayMs);
            response.put("status", "starting");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error starting remigration", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to start remigration: " + e.getMessage()));
        }
    }

    /**
     * Stop ongoing migration (graceful stop after current batch)
     * POST /api/admin/migration/stop
     */
    @PostMapping("/stop")
    public ResponseEntity<Map<String, Object>> stopMigration() {
        if (!migrationInProgress) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "No migration in progress"));
        }
        
        migrationStatus = "stopping";
        logger.info("Migration stop requested - will stop after current batch");
        
        return ResponseEntity.ok(Map.of(
            "message", "Migration stop requested",
            "status", "stopping"
        ));
    }

    // 🔧 新增：停止重新迁移
    /**
     * Stop ongoing remigration (graceful stop after current batch)
     * POST /api/admin/migration/remigration/stop
     */
    @PostMapping("/remigration/stop")
    public ResponseEntity<Map<String, Object>> stopRemigration() {
        if (!remigrationInProgress) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "No remigration in progress"));
        }
        
        remigrationStatus = "stopping";
        logger.info("Remigration stop requested - will stop after current batch");
        
        return ResponseEntity.ok(Map.of(
            "message", "Remigration stop requested",
            "status", "stopping"
        ));
    }

    /**
     * Execute the actual migration process
     */
    private void executeMigration(int batchSize, int delayMs) {
        try {
            migrationInProgress = true;
            migrationStatus = "running";
            
            // Reset counters
            processedCount.set(0);
            successCount.set(0);
            errorCount.set(0);
            
            logger.info(String.format("Starting dimension migration with batchSize=%d, delayMs=%d", batchSize, delayMs));
            
            // Get all submissions without dimensions
            List<Submission> allSubmissions = submissionService.getAllSubmissionEntities();
            List<Submission> submissionsNeedingMigration = allSubmissions.stream()
                .filter(s -> s.getImageWidth() == null || s.getImageHeight() == null || s.getAspectRatio() == null)
                .toList();
            
            totalCount = submissionsNeedingMigration.size();
            logger.info(String.format("Found %d submissions needing dimension migration", totalCount));
            
            if (totalCount == 0) {
                migrationStatus = "completed";
                migrationInProgress = false;
                logger.info("No submissions need migration - all already have dimensions");
                return;
            }
            
            // Process in batches
            for (int i = 0; i < submissionsNeedingMigration.size(); i += batchSize) {
                // Check if stop was requested
                if ("stopping".equals(migrationStatus)) {
                    migrationStatus = "stopped";
                    migrationInProgress = false;
                    logger.info("Migration stopped by admin request");
                    return;
                }
                
                int endIndex = Math.min(i + batchSize, submissionsNeedingMigration.size());
                List<Submission> batch = submissionsNeedingMigration.subList(i, endIndex);
                
                logger.info(String.format("Processing batch %d-%d of %d total submissions", 
                           i + 1, endIndex, totalCount));
                
                // Process batch
                processBatch(batch);
                
                // Delay between batches to avoid overloading the system
                if (endIndex < submissionsNeedingMigration.size()) {
                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        logger.warning("Migration interrupted during delay");
                        break;
                    }
                }
            }
            
            migrationStatus = "completed";
            migrationInProgress = false;
            
            logger.info(String.format("Migration completed: %d processed, %d successful, %d errors", 
                       processedCount.get(), successCount.get(), errorCount.get()));
            
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error during migration execution", e);
            migrationStatus = "error";
            migrationInProgress = false;
        }
    }

    // 🔧 新增：执行重新迁移过程
    /**
     * Execute the actual remigration process for ALL submissions
     */
    private void executeRemigration(int batchSize, int delayMs) {
        try {
            remigrationInProgress = true;
            remigrationStatus = "running";
            
            // Reset counters
            remigrationProcessedCount.set(0);
            remigrationSuccessCount.set(0);
            remigrationErrorCount.set(0);
            
            logger.info(String.format("开始重新迁移所有图片尺寸 batchSize=%d, delayMs=%d", batchSize, delayMs));
            
            // Get ALL submissions for remigration
            List<Submission> allSubmissions = submissionService.getAllSubmissionEntities();
            
            remigrationTotalCount = allSubmissions.size();
            logger.info(String.format("重新迁移：发现 %d 个投稿需要重新处理", remigrationTotalCount));
            
            if (remigrationTotalCount == 0) {
                remigrationStatus = "completed";
                remigrationInProgress = false;
                logger.info("没有投稿需要重新迁移");
                return;
            }
            
            // Process in batches
            for (int i = 0; i < allSubmissions.size(); i += batchSize) {
                // Check if stop was requested
                if ("stopping".equals(remigrationStatus)) {
                    remigrationStatus = "stopped";
                    remigrationInProgress = false;
                    logger.info("重新迁移被管理员停止");
                    return;
                }
                
                int endIndex = Math.min(i + batchSize, allSubmissions.size());
                List<Submission> batch = allSubmissions.subList(i, endIndex);
                
                logger.info(String.format("重新迁移批次 %d-%d，总计 %d 个投稿", 
                           i + 1, endIndex, remigrationTotalCount));
                
                // Process batch for remigration
                processRemigrationBatch(batch);
                
                // Delay between batches to avoid overloading the system
                if (endIndex < allSubmissions.size()) {
                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        logger.warning("重新迁移在延迟期间被中断");
                        break;
                    }
                }
            }
            
            remigrationStatus = "completed";
            remigrationInProgress = false;
            
            logger.info(String.format("重新迁移完成: %d 已处理, %d 成功, %d 错误", 
                       remigrationProcessedCount.get(), remigrationSuccessCount.get(), remigrationErrorCount.get()));
            
        } catch (Exception e) {
            logger.log(Level.SEVERE, "重新迁移执行过程中发生错误", e);
            remigrationStatus = "error";
            remigrationInProgress = false;
        }
    }

    /**
     * Process a single batch of submissions
     */
    private void processBatch(List<Submission> batch) {
        for (Submission submission : batch) {
            try {
                processedCount.incrementAndGet();
                
                // Get image dimensions from URL
                var dimensions = imageDimensionService.getImageDimensionsFromUrl(submission.getImageUrl());
                
                if (dimensions != null) {
                    // Update submission with dimensions
                    submission.setImageDimensions(dimensions.getWidth(), dimensions.getHeight());
                    submissionService.updateSubmission(submission);
                    
                    successCount.incrementAndGet();
                    logger.fine(String.format("Updated dimensions for submission %d: %dx%d", 
                               submission.getId(), dimensions.getWidth(), dimensions.getHeight()));
                } else {
                    errorCount.incrementAndGet();
                    logger.warning(String.format("Could not get dimensions for submission %d: %s", 
                                  submission.getId(), submission.getImageUrl()));
                }
                
            } catch (Exception e) {
                errorCount.incrementAndGet();
                logger.log(Level.WARNING, 
                          String.format("Error processing submission %d", submission.getId()), e);
            }
        }
    }

    // 🔧 新增：处理重新迁移批次
    /**
     * Process a single batch of submissions for remigration (ALL submissions)
     */
    private void processRemigrationBatch(List<Submission> batch) {
        for (Submission submission : batch) {
            try {
                remigrationProcessedCount.incrementAndGet();
                
                // 🔧 使用修复后的getImageDimensionsFromUrl方法，获取原始图片尺寸
                var dimensions = imageDimensionService.getImageDimensionsFromUrl(submission.getImageUrl());
                
                if (dimensions != null) {
                    // Update submission with corrected dimensions
                    submission.setImageDimensions(dimensions.getWidth(), dimensions.getHeight());
                    submissionService.updateSubmission(submission);
                    
                    remigrationSuccessCount.incrementAndGet();
                    logger.info(String.format("重新迁移投稿 %d 尺寸: %dx%d (比例: %.4f)", 
                               submission.getId(), dimensions.getWidth(), dimensions.getHeight(), 
                               (double) dimensions.getWidth() / dimensions.getHeight()));
                } else {
                    remigrationErrorCount.incrementAndGet();
                    logger.warning(String.format("无法获取投稿 %d 的图片尺寸: %s", 
                                  submission.getId(), submission.getImageUrl()));
                }
                
            } catch (Exception e) {
                remigrationErrorCount.incrementAndGet();
                logger.log(Level.WARNING, 
                          String.format("处理投稿 %d 重新迁移时发生错误", submission.getId()), e);
            }
        }
    }
} 