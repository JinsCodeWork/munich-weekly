package com.munichweekly.backend.devtools.annotation;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

/**
 * Used to describe API method purpose for documentation generation.
 */
@Retention(RetentionPolicy.RUNTIME)
public @interface Description {
    String value();
}