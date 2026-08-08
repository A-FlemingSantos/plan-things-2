package com.planthings.api.docs;

import com.planthings.api.common.api.ApiEnvelope;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documents/embeds")
public class DocsEmbedController {

  private final DocsEmbedSearchService searchService;

  public DocsEmbedController(DocsEmbedSearchService searchService) {
    this.searchService = searchService;
  }

  @GetMapping("/unsplash/search")
  public ApiEnvelope<DocsEmbedSearchService.UnsplashSearchResponse> searchUnsplash(
      @RequestParam("q") String query,
      @RequestParam(value = "page", defaultValue = "1") int page
  ) {
    return ApiEnvelope.ok(searchService.searchUnsplash(query, page));
  }

  @GetMapping("/youtube/search")
  public ApiEnvelope<DocsEmbedSearchService.YouTubeSearchResponse> searchYouTube(
      @RequestParam("q") String query,
      @RequestParam(value = "pageToken", required = false) String pageToken
  ) {
    return ApiEnvelope.ok(searchService.searchYouTube(query, pageToken));
  }
}
