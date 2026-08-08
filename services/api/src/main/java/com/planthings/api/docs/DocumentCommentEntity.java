package com.planthings.api.docs;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "document_comments")
public class DocumentCommentEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID documentId;

  @Column(nullable = false)
  private UUID authorUserId;

  @Column(nullable = false, length = 4000)
  private String body;

  @Column(nullable = false, length = 1000)
  private String quotedText;

  @Column(nullable = false)
  private int selectionStart;

  @Column(nullable = false)
  private int selectionEnd;

  public UUID getDocumentId() {
    return documentId;
  }

  public void setDocumentId(UUID documentId) {
    this.documentId = documentId;
  }

  public UUID getAuthorUserId() {
    return authorUserId;
  }

  public void setAuthorUserId(UUID authorUserId) {
    this.authorUserId = authorUserId;
  }

  public String getBody() {
    return body;
  }

  public void setBody(String body) {
    this.body = body;
  }

  public String getQuotedText() {
    return quotedText;
  }

  public void setQuotedText(String quotedText) {
    this.quotedText = quotedText;
  }

  public int getSelectionStart() {
    return selectionStart;
  }

  public void setSelectionStart(int selectionStart) {
    this.selectionStart = selectionStart;
  }

  public int getSelectionEnd() {
    return selectionEnd;
  }

  public void setSelectionEnd(int selectionEnd) {
    this.selectionEnd = selectionEnd;
  }
}
