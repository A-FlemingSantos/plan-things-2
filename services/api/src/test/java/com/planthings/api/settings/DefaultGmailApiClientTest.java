package com.planthings.api.settings;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.common.error.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

class DefaultGmailApiClientTest {

  @Test
  void shouldMapDisabledGmailApiSendFailure() {
    RestClient.Builder builder = RestClient.builder();
    MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    DefaultGmailApiClient client = new DefaultGmailApiClient(builder, new ObjectMapper());

    server.expect(requestTo("https://gmail.googleapis.com/gmail/v1/users/me/messages/send"))
        .andExpect(method(HttpMethod.POST))
        .andRespond(withStatus(HttpStatus.FORBIDDEN)
            .contentType(MediaType.APPLICATION_JSON)
            .body("""
                {
                  "error": {
                    "code": 403,
                    "message": "Gmail API has not been used in project 123 before or it is disabled.",
                    "status": "PERMISSION_DENIED",
                    "details": [
                      {
                        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
                        "reason": "SERVICE_DISABLED",
                        "domain": "googleapis.com"
                      }
                    ]
                  }
                }
                """));

    BadRequestException exception = assertThrows(
        BadRequestException.class,
        () -> client.sendMessage("access-token", "raw-message")
    );

    assertEquals("GMAIL_API_NAO_HABILITADA", exception.getCode());
    server.verify();
  }

  @Test
  void shouldMapInsufficientScopesSendFailure() {
    RestClient.Builder builder = RestClient.builder();
    MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    DefaultGmailApiClient client = new DefaultGmailApiClient(builder, new ObjectMapper());

    server.expect(requestTo("https://gmail.googleapis.com/gmail/v1/users/me/messages/send"))
        .andExpect(method(HttpMethod.POST))
        .andRespond(withStatus(HttpStatus.FORBIDDEN)
            .contentType(MediaType.APPLICATION_JSON)
            .body("""
                {
                  "error": {
                    "code": 403,
                    "message": "Request had insufficient authentication scopes.",
                    "errors": [
                      {
                        "domain": "global",
                        "reason": "insufficientPermissions",
                        "message": "Insufficient Permission"
                      }
                    ],
                    "status": "PERMISSION_DENIED"
                  }
                }
                """));

    BadRequestException exception = assertThrows(
        BadRequestException.class,
        () -> client.sendMessage("access-token", "raw-message")
    );

    assertEquals("GMAIL_SCOPE_AUSENTE", exception.getCode());
    server.verify();
  }
}
