package com.munichweekly.backend.devtools;

import org.reflections.Reflections;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

/**
 * Utility to find all classes annotated with @RestController in the project.
 */
public class ClassScanner {
    public static Set<Class<?>> scanForControllers(String basePackage) {
        Reflections reflections = new Reflections(basePackage);
        return reflections.getTypesAnnotatedWith(RestController.class);
    }
}