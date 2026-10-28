package app.credito;

import java.nio.file.*;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CreditoApplication {
 public static void main(String[] args) throws Exception {
  String directory = System.getenv("CREDITO_DATA_DIR");
  if (directory == null) directory = Path.of(System.getProperty("user.home"), "AppData", "Local", "GestaoCredito").toString();
  Files.createDirectories(Path.of(directory));
  System.setProperty("credito.data-dir", directory.replace('\\','/'));
  SpringApplication.run(CreditoApplication.class, args);
 }
}
