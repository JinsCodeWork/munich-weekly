package com.munichweekly.backend.service;

import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.UserRepository;
import com.munichweekly.backend.repository.VoteRepository;
import com.munichweekly.backend.security.CurrentUserUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubmissionServiceTest {

    @Mock
    private SubmissionRepository submissionRepository;
    
    @Mock
    private IssueRepository issueRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private VoteRepository voteRepository;
    
    @Mock
    private StorageService storageService;
    
    private SubmissionService submissionService;
    
    private User testUser;
    private User differentUser;
    private Submission testSubmission;
    private final Long testUserId = 1L;
    private final Long differentUserId = 2L;
    private final Long testSubmissionId = 100L;
    
    @BeforeEach
    public void setup() throws Exception {
        submissionService = new SubmissionService(
            submissionRepository,
            issueRepository,
            userRepository,
            voteRepository,
            storageService
        );
        
        // 创建测试用户
        testUser = new User();
        setUserId(testUser, testUserId);
        testUser.setEmail("test@example.com");
        testUser.setRole("user");
        
        // 创建不同的用户
        differentUser = new User();
        setUserId(differentUser, differentUserId);
        differentUser.setEmail("different@example.com");
        differentUser.setRole("user");
        
        // 创建测试提交
        Issue testIssue = new Issue();
        setIssueId(testIssue, 1L);
        testIssue.setTitle("Test Issue");
        
        testSubmission = new Submission();
        setSubmissionId(testSubmission, testSubmissionId);
        testSubmission.setUser(testUser);
        testSubmission.setIssue(testIssue);
        testSubmission.setImageUrl("https://r2.cloudflarestorage.com/munichweekly-photoupload/issues/1/submissions/user1_submission100_20230615.jpg");
        testSubmission.setDescription("Test submission");
    }
    
    // 使用反射设置ID字段
    private void setUserId(User user, Long id) throws Exception {
        Field idField = User.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(user, id);
    }
    
    private void setIssueId(Issue issue, Long id) throws Exception {
        Field idField = Issue.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(issue, id);
    }
    
    private void setSubmissionId(Submission submission, Long id) throws Exception {
        Field idField = Submission.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(submission, id);
    }
    
    @Test
    public void testDeleteSubmission_ShouldDeleteImageFile() {
        // 设置模拟行为
        try (MockedStatic<CurrentUserUtil> mockedStatic = Mockito.mockStatic(CurrentUserUtil.class)) {
            // 模拟当前登录的用户
            mockedStatic.when(CurrentUserUtil::getUserIdOrThrow).thenReturn(testUserId);
            
            // 模拟数据库中找到用户和提交
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(submissionRepository.findById(testSubmissionId)).thenReturn(Optional.of(testSubmission));
            
            // 模拟存储服务删除文件成功
            when(storageService.deleteFile(testSubmission.getImageUrl())).thenReturn(true);
            
            // 执行删除操作
            submissionService.deleteSubmission(testSubmissionId);
            
            // 验证是否调用了正确的方法
            verify(voteRepository).deleteBySubmission(testSubmission);
            verify(submissionRepository).delete(testSubmission);
            verify(storageService).deleteFile(testSubmission.getImageUrl());
        }
    }
    
    @Test
    public void testDeleteSubmission_WhenFileDeleteFails() {
        // 设置模拟行为
        try (MockedStatic<CurrentUserUtil> mockedStatic = Mockito.mockStatic(CurrentUserUtil.class)) {
            // 模拟当前登录的用户
            mockedStatic.when(CurrentUserUtil::getUserIdOrThrow).thenReturn(testUserId);
            
            // 模拟数据库中找到用户和提交
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(submissionRepository.findById(testSubmissionId)).thenReturn(Optional.of(testSubmission));
            
            // 模拟存储服务删除文件失败
            when(storageService.deleteFile(testSubmission.getImageUrl())).thenReturn(false);
            
            // 执行删除操作 - 即使文件删除失败，方法也应继续执行而不抛出异常
            submissionService.deleteSubmission(testSubmissionId);
            
            // 验证是否调用了正确的方法
            verify(voteRepository).deleteBySubmission(testSubmission);
            verify(submissionRepository).delete(testSubmission);
            verify(storageService).deleteFile(testSubmission.getImageUrl());
        }
    }
    
    @Test
    public void testDeleteSubmission_NotAuthorized() {
        // 设置模拟行为
        try (MockedStatic<CurrentUserUtil> mockedStatic = Mockito.mockStatic(CurrentUserUtil.class)) {
            // 模拟当前登录的用户（与提交所有者不同）
            mockedStatic.when(CurrentUserUtil::getUserIdOrThrow).thenReturn(differentUserId);
            
            when(userRepository.findById(differentUserId)).thenReturn(Optional.of(differentUser));
            when(submissionRepository.findById(testSubmissionId)).thenReturn(Optional.of(testSubmission));
            
            // 验证是否抛出安全异常
            SecurityException exception = assertThrows(
                SecurityException.class,
                () -> submissionService.deleteSubmission(testSubmissionId)
            );
            
            assertEquals("Not authorized to delete this submission", exception.getMessage());
            
            // 验证未调用删除方法
            verify(submissionRepository, never()).delete(any());
            verify(storageService, never()).deleteFile(any());
        }
    }
} 