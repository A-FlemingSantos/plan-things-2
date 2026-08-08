package com.planthings.api.docs;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.common.error.BadRequestException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
public class DocsEmbedSearchService {

  private static final int PAGE_SIZE = 9;

  private final RestClient restClient;
  private final DocsEmbedProperties properties;

  public DocsEmbedSearchService(RestClient.Builder restClientBuilder, DocsEmbedProperties properties) {
    this.restClient = restClientBuilder.build();
    this.properties = properties;
  }

  public UnsplashSearchResponse searchUnsplash(String query, int page) {
    if (!properties.getUnsplash().isConfigured()) {
      throw new BadRequestException(
          "UNSPLASH_NAO_CONFIGURADO",
          "A busca do Unsplash nao esta configurada."
      );
    }
    if (!StringUtils.hasText(query)) {
      throw new BadRequestException("BUSCA_INVALIDA", "Informe um termo de busca.");
    }

    int safePage = Math.max(page, 1);
    String encodedQuery = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);
    String url = "https://api.unsplash.com/search/photos?query="
        + encodedQuery
        + "&page="
        + safePage
        + "&per_page="
        + PAGE_SIZE;

    try {
      JsonNode response = restClient.get()
          .uri(url)
          .header("Authorization", "Client-ID " + properties.getUnsplash().getAccessKey())
          .header("Accept-Version", "v1")
          .retrieve()
          .body(JsonNode.class);

      if (response == null) {
        return new UnsplashSearchResponse(0, safePage, List.of());
      }

      List<UnsplashPhoto> results = new ArrayList<>();
      JsonNode items = response.path("results");
      if (items.isArray()) {
        for (JsonNode item : items) {
          String previewUrl = item.path("urls").path("small").asText("");
          if (!StringUtils.hasText(previewUrl)) {
            previewUrl = item.path("urls").path("regular").asText("");
          }
          String fullUrl = item.path("urls").path("regular").asText(previewUrl);
          results.add(new UnsplashPhoto(
              item.path("id").asText(""),
              previewUrl,
              fullUrl,
              item.path("alt_description").asText(""),
              item.path("width").asInt(0),
              item.path("height").asInt(0)
          ));
        }
      }

      return new UnsplashSearchResponse(response.path("total").asInt(0), safePage, results);
    } catch (RestClientResponseException ex) {
      throw new BadRequestException(
          "UNSPLASH_BUSCA_FALHOU",
          "Nao foi possivel buscar imagens no Unsplash."
      );
    }
  }

  public YouTubeSearchResponse searchYouTube(String query, String pageToken) {
    if (!properties.getYoutube().isConfigured()) {
      throw new BadRequestException(
          "YOUTUBE_NAO_CONFIGURADO",
          "A busca do YouTube nao esta configurada."
      );
    }
    if (!StringUtils.hasText(query)) {
      throw new BadRequestException("BUSCA_INVALIDA", "Informe um termo de busca.");
    }

    String encodedQuery = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);
    StringBuilder url = new StringBuilder("https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=")
        .append(encodedQuery)
        .append("&maxResults=")
        .append(PAGE_SIZE)
        .append("&key=")
        .append(properties.getYoutube().getApiKey());

    if (StringUtils.hasText(pageToken)) {
      url.append("&pageToken=").append(URLEncoder.encode(pageToken.trim(), StandardCharsets.UTF_8));
    }

    try {
      JsonNode response = restClient.get()
          .uri(url.toString())
          .retrieve()
          .body(JsonNode.class);

      if (response == null) {
        return new YouTubeSearchResponse(0, null, List.of());
      }

      List<YouTubeVideo> results = new ArrayList<>();
      JsonNode items = response.path("items");
      if (items.isArray()) {
        for (JsonNode item : items) {
          String videoId = item.path("id").path("videoId").asText("");
          if (!StringUtils.hasText(videoId)) {
            continue;
          }
          JsonNode thumbnail = snippet.path("thumbnails").path("medium");
          String thumbnailUrl = thumbnail.path("url").asText("");
          if (!StringUtils.hasText(thumbnailUrl)) {
            thumbnail = snippet.path("thumbnails").path("default");
            thumbnailUrl = thumbnail.path("url").asText("");
          }
          results.add(new YouTubeVideo(
              videoId,
              snippet.path("title").asText(""),
              thumbnailUrl,
              "https://www.youtube.com/watch?v=" + videoId,
              thumbnail.path("width").asInt(0),
              thumbnail.path("height").asInt(0)
          ));
        }
      }

      return new YouTubeSearchResponse(
          response.path("pageInfo").path("totalResults").asLong(0),
          response.path("nextPageToken").asText(null),
          results
      );
    } catch (RestClientResponseException ex) {
      throw new BadRequestException(
          "YOUTUBE_BUSCA_FALHOU",
          "Nao foi possivel buscar videos no YouTube."
      );
    }
  }

  public record UnsplashPhoto(String id, String previewUrl, String fullUrl, String alt, int width, int height) {
  }

  public record UnsplashSearchResponse(int total, int page, List<UnsplashPhoto> results) {
  }

  public record YouTubeVideo(String id, String title, String thumbnailUrl, String watchUrl, int width, int height) {
  }

  public record YouTubeSearchResponse(long total, String nextPageToken, List<YouTubeVideo> results) {
  }
}
