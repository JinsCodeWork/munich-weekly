package com.munichweekly.backend.devtools;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import com.munichweekly.backend.repository.*;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("dev")
public class DataResetService {

    private final VoteRepository voteRepository;
    private final SubmissionRepository submissionRepository;
    private final IssueRepository issueRepository;
    private final UserAuthProviderRepository authProviderRepository;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;


    @PersistenceContext
    private EntityManager entityManager;

    public DataResetService(VoteRepository voteRepository,
                            SubmissionRepository submissionRepository,
                            IssueRepository issueRepository,
                            UserAuthProviderRepository authProviderRepository,
                            UserRepository userRepository,
                            PasswordResetTokenRepository passwordResetTokenRepository) {
        this.voteRepository = voteRepository;
        this.submissionRepository = submissionRepository;
        this.issueRepository = issueRepository;
        this.authProviderRepository = authProviderRepository;
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    @Transactional
    public void resetAllData() {
        System.out.println("🧹 开始清空数据库数据...");
        voteRepository.deleteAll();
        submissionRepository.deleteAll();
        issueRepository.deleteAll();
        passwordResetTokenRepository.deleteAll(); // 先删除密码重置令牌
        authProviderRepository.deleteAll();
        userRepository.deleteAll();

        entityManager.createNativeQuery("ALTER SEQUENCE users_id_seq RESTART WITH 1").executeUpdate();
        entityManager.createNativeQuery("ALTER SEQUENCE issues_id_seq RESTART WITH 1").executeUpdate();
        entityManager.createNativeQuery("ALTER SEQUENCE submissions_id_seq RESTART WITH 1").executeUpdate();
        entityManager.createNativeQuery("ALTER SEQUENCE votes_id_seq RESTART WITH 1").executeUpdate();
        entityManager.createNativeQuery("ALTER SEQUENCE password_reset_tokens_id_seq RESTART WITH 1").executeUpdate();

        System.out.println("✅ 数据清空完成！");
    }
}