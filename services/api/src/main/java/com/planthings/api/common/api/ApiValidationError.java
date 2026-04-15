package com.planthings.api.common.api;

public record ApiValidationError(
    String field,
    String message
) {
}
