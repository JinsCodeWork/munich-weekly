package com.munichweekly.backend.devtools;

import com.munichweekly.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DataResetService {

    private final VoteRepository voteRepository;
    private final SubmissionRepository submissionRepository;
    private final IssueRepository issueRepository;
    private final UserAuthProviderRepository authProviderRepository;
    private final UserRepository userRepository;

    public DataResetService(VoteRepository voteRepository,
                            SubmissionRepository submissionRepository,
                            IssueRepository issueRepository,
                            UserAuthProviderRepository authProviderRepository,
                            UserRepository userRepository) {
        this.voteRepository = voteRepository;
        this.submissionRepository = submissionRepository;
        this.issueRepository = issueRepository;
        this.authProviderRepository = authProviderRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void resetAllData() {
        System.out.println("🧹 开始清空数据库数据...");
        voteRepository.deleteAll();
        submissionRepository.deleteAll();
        issueRepository.deleteAll();
        authProviderRepository.deleteAll(); // 如果你还没用到，这行无害
        userRepository.deleteAll();
        System.out.println("✅ 数据清空完成！");
    }
}