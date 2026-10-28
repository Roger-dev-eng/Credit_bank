package app.credito.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.*;
import org.springframework.context.annotation.*;

@Configuration
public class OpenApiConfig {

  @Bean
  OpenAPI documentacao() {
    return new OpenAPI()
      .info(new Info().title("Gestão de Crédito - API local").version("0.1.0"))
      .components(
        new Components().addSecuritySchemes(
          "tokenLocal",
          new SecurityScheme()
            .type(SecurityScheme.Type.APIKEY)
            .in(SecurityScheme.In.HEADER)
            .name("X-Credito-Token")
        )
      )
      .addSecurityItem(new SecurityRequirement().addList("tokenLocal"));
  }
}
