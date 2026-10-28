package app.credito.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiLocalFilter extends OncePerRequestFilter {

  private final byte[] token;

  public ApiLocalFilter(
    @Value("${credito.token:${CREDITO_TOKEN:}}") String token
  ) {
    if (token.length() < 32) throw new IllegalStateException(
      "Defina CREDITO_TOKEN com pelo menos 32 caracteres."
    );
    this.token = token.getBytes(StandardCharsets.UTF_8);
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest req,
    HttpServletResponse res,
    FilterChain chain
  ) throws ServletException, IOException {
    String supplied = req.getHeader("X-Credito-Token");
    if (
      req.getHeader("Origin") != null ||
      supplied == null ||
      !MessageDigest.isEqual(token, supplied.getBytes(StandardCharsets.UTF_8))
    ) {
      res.sendError(403);
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    // One local financial request at a time, including backup/restore, to avoid SQLite read-to-write promotion races.
    synchronized (this) {
      chain.doFilter(req, res);
    }
  }
}
