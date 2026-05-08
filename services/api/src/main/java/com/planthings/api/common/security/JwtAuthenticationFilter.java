package com.planthings.api.common.security;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.auth.UserRepository;
import com.planthings.api.auth.UserSessionEntity;
import com.planthings.api.auth.UserSessionService;
import com.planthings.api.common.error.UnauthorizedException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final UserRepository userRepository;
  private final UserSessionService userSessionService;

  public JwtAuthenticationFilter(
      JwtService jwtService,
      UserRepository userRepository,
      UserSessionService userSessionService
  ) {
    this.jwtService = jwtService;
    this.userRepository = userRepository;
    this.userSessionService = userSessionService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain
  ) throws ServletException, IOException {
    String authorization = request.getHeader("Authorization");

    if (authorization == null || !authorization.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }

    String token = authorization.substring(7);

    try {
      if (!jwtService.isValid(token)) {
        throw new UnauthorizedException("TOKEN_INVALIDO", "Sua sessao expirou. Faca login novamente.");
      }

      java.util.UUID userId = jwtService.extractUserId(token);
      java.util.UUID sessionId = jwtService.extractSessionId(token);
      if (sessionId == null) {
        throw new UnauthorizedException("SESSAO_INVALIDA", "Sua sessao nao e mais valida.");
      }

      if (SecurityContextHolder.getContext().getAuthentication() == null) {
        UserSessionEntity session = userSessionService.requireActiveSession(userId, sessionId);
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new UnauthorizedException("USUARIO_INVALIDO", "Nao foi possivel identificar o usuario autenticado."));

        SecurityUser principal = new SecurityUser(user.getId(), session.getId(), user.getEmail(), user.getPasswordHash());
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
            principal,
            null,
            principal.getAuthorities()
        );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        userSessionService.touchSession(session);
      }
    } catch (RuntimeException ex) {
      SecurityContextHolder.clearContext();
    }

    filterChain.doFilter(request, response);
  }
}
