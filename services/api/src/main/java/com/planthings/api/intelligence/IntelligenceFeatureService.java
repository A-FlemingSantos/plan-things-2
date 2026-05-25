package com.planthings.api.intelligence;

import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.ServiceUnavailableException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class IntelligenceFeatureService {

  private final IntelligenceProperties properties;

  public IntelligenceFeatureService(IntelligenceProperties properties) {
    this.properties = properties;
  }

  public IntelligenceProperties properties() {
    return properties;
  }

  public void requireEnabled() {
    if (!properties.isEnabled()) {
      throw new ServiceUnavailableException(
          "INTELLIGENCE_DESABILITADA",
          "O Plan Things Intelligence ainda nao esta habilitado neste ambiente."
      );
    }
  }

  public void requireConfigured() {
    requireEnabled();
    if (!StringUtils.hasText(properties.getApiKey())) {
      throw new BadRequestException(
          "INTELLIGENCE_NAO_CONFIGURADA",
          "A chave da OpenAI nao esta configurada para o Intelligence."
      );
    }
  }
}
