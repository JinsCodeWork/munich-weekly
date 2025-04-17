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

        // 创建管理员
        User admin = new User("dongkai.jin@tum.de", "marc", null, "admin");
        userRepository.save(admin);

        // 创建普通用户
        User user = new User("xiaoming@gmail.com", "小明", null, "user");
        userRepository.save(user);

        // 创建 2 期活动，每期 1 周时间
        for (int i = 1; i <= 2; i++) {
            LocalDateTime base = (i == 1)
                    ? LocalDateTime.now().minusDays(1) // 第 1 期正在投稿
                    : LocalDateTime.now().plusDays(5); // 第 2 期尚未开始

            Issue issue = new Issue(
                    "第 " + i + " 期摄影周刊",
                    "这一期是主题摄影比赛，欢迎投稿！",
                    base,
                    base.plusDays(3),
                    base.plusDays(4),
                    base.plusDays(7)
            );
            issueRepository.save(issue);

            // 管理员投稿
            Submission s1 = new Submission(admin, issue, "https://picsum.photos/seed/admin" + i + "/800", "管理员的作品 " + i);
            s1.setStatus("approved");
            submissionRepository.save(s1);

            // 普通用户投稿
            Submission s2 = new Submission(user, issue, "https://picsum.photos/seed/user" + i + "/800", "小明的投稿 " + i);
            s2.setStatus("approved");
            submissionRepository.save(s2);
        }

        System.out.println("✅ 初始化数据完成！");
    }
}