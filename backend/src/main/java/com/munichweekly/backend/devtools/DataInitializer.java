package com.munichweekly.backend.devtools;

import com.munichweekly.backend.model.*;
import com.munichweekly.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Order(2)
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final IssueRepository issueRepository;
    private final SubmissionRepository submissionRepository;

    public DataInitializer(UserRepository userRepository,
                           IssueRepository issueRepository,
                           SubmissionRepository submissionRepository) {
        this.userRepository = userRepository;
        this.issueRepository = issueRepository;
        this.submissionRepository = submissionRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            System.out.println("➡️ 数据已存在，跳过初始化。");
            return;
        }

        User admin = new User("dongkai.jin@tum.de", "123456","marc", null, "admin");
        User savedAdmin = userRepository.saveAndFlush(admin); // 自动生成 ID

        User user = new User("xiaoming@gmail.com", "12399!_zz","小明", null, "user");
        User savedUser = userRepository.saveAndFlush(user);

        // 第一期：投票中
        LocalDateTime base1 = LocalDateTime.now().minusDays(1);
        Issue issue1 = new Issue(
                "第 1 期摄影周刊",
                "这一期是主题摄影比赛，欢迎投稿！",
                base1,
                base1.plusDays(3),
                base1,
                base1.plusDays(7)
        );
        Issue savedIssue1 = issueRepository.saveAndFlush(issue1);

        Submission s1 = new Submission(admin, savedIssue1, "https://picsum.photos/seed/admin1/800", "管理员的作品 1");
        s1.setStatus("approved");
        submissionRepository.save(s1);

        Submission s2 = new Submission(user, savedIssue1, "https://picsum.photos/seed/user1/800", "小明的投稿 1");
        s2.setStatus("approved");
        submissionRepository.save(s2);

        // 第二期：尚未开始
        LocalDateTime base2 = LocalDateTime.now().plusDays(5);
        Issue issue2 = new Issue(
                "第 2 期摄影周刊",
                "这一期是主题摄影比赛，欢迎投稿！",
                base2,
                base2.plusDays(3),
                base2,
                base2.plusDays(7)
        );
        Issue savedIssue2 = issueRepository.saveAndFlush(issue2);

        Submission s3 = new Submission(admin, savedIssue2, "https://picsum.photos/seed/admin2/800", "管理员的作品 2");
        s3.setStatus("approved");
        submissionRepository.save(s3);

        Submission s4 = new Submission(user, savedIssue2, "https://picsum.photos/seed/user2/800", "小明的投稿 2");
        s4.setStatus("approved");
        submissionRepository.save(s4);

        System.out.println("✅ 初始化数据完成！");
        System.out.println("🧪 adminId = " + savedAdmin.getId());
        System.out.println("🧪 userId = " + savedUser.getId());
        System.out.println("🧪 issue1Id = " + savedIssue1.getId());
        System.out.println("🧪 issue2Id = " + savedIssue2.getId());
    }
}