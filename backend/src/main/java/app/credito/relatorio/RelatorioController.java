package app.credito.relatorio;

import app.credito.cliente.ClienteService;
import app.credito.contrato.ContratoService;
import java.io.*;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class RelatorioController {

  private final ContratoService contratos;
  private final ClienteService clientes;

  public RelatorioController(ContratoService s, ClienteService c) {
    contratos = s;
    clientes = c;
  }

  @GetMapping("/api/contratos/{id}/pdf")
  public ResponseEntity<byte[]> pdf(@PathVariable String id) throws Exception {
    var e = contratos.extrato(id);
    var cliente = clientes.obter(e.contrato().get("cliente_id").toString());
    try (var doc = new PDDocument(); var out = new ByteArrayOutputStream()) {
      var linhas = new ArrayList<String>();
      NumberFormat brl = NumberFormat.getCurrencyInstance(
        Locale.of("pt", "BR")
      );
      linhas.add("Gestão de Crédito | Extrato de contrato");
      linhas.add("Cliente: " + cliente.nome);
      linhas.add("Contrato: " + id);
      linhas.add("Modalidade: " + e.contrato().get("modalidade"));
      linhas.add("Emitido em: " + e.emitidoEm());
      linhas.add("");
      var i = e.indicadores();
      linhas.add(
        "Original: " +
          brl.format(i.original()) +
          " | Previsto: " +
          brl.format(i.previsto())
      );
      linhas.add(
        "Recebido: " +
          brl.format(i.recebido()) +
          " | Saldo: " +
          brl.format(i.saldo())
      );
      linhas.add(
        "Principal devido: " +
          brl.format(i.principalDevido()) +
          " | Juros futuros: " +
          brl.format(i.jurosFuturos())
      );
      linhas.add(
        "Encargos pendentes: " +
          brl.format(i.encargos()) +
          " | Em atraso: " +
          brl.format(i.atraso())
      );
      linhas.add("");
      linhas.add(
        "CRONOGRAMA | Principal / Juros / Recebido / Multa / Mora / Saldo"
      );
      for (var p : e.parcelas()) {
        linhas.add(
          String.format(
            "%03d | %s | %s",
            p.numero(),
            p.vencimento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
            p.status()
          )
        );
        linhas.add(
          "  " +
            brl.format(p.principal()) +
            " / " +
            brl.format(p.juros()) +
            " / " +
            brl.format(p.recebido()) +
            " / " +
            brl.format(p.multa()) +
            " / " +
            brl.format(p.mora()) +
            " / " +
            brl.format(p.saldo())
        );
      }
      linhas.add("");
      linhas.add("HISTÓRICO DE PAGAMENTOS");
      for (var pg : e.pagamentos()) {
        linhas.add(
          pg.get("data_efetiva") +
            " | " +
            brl.format(
              ContratoService.valor(
                ((Number) pg.get("valor_centavos")).longValue()
              )
            ) +
            " | " +
            (pg.get("estornado_em") == null ? "Recebido" : "Estornado")
        );
      }
      linhas.add("");
      linhas.add(
        "Documento informativo. Valores derivados dos registros financeiros persistidos."
      );
      PDFont font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
      int cursor = 0,
        pageNo = 0;
      while (cursor < linhas.size()) {
        var page = new PDPage(PDRectangle.A4);
        doc.addPage(page);
        pageNo++;
        try (var stream = new PDPageContentStream(doc, page)) {
          stream.setNonStrokingColor(26 / 255f, 32 / 255f, 53 / 255f);
          stream.addRect(0, 795, 596, 48);
          stream.fill();
          stream.beginText();
          stream.setFont(font, 12);
          stream.setNonStrokingColor(1f, 1f, 1f);
          stream.newLineAtOffset(36, 813);
          stream.showText("Gestão de Crédito");
          stream.endText();
          stream.beginText();
          stream.setNonStrokingColor(0.12f, 0.15f, 0.2f);
          stream.setFont(font, 9);
          stream.setLeading(15);
          stream.newLineAtOffset(36, 770);
          int count = 0;
          while (cursor < linhas.size() && count < 46) {
            String line = seguro(linhas.get(cursor++), font);
            while ((font.getStringWidth(line) / 1000) * 9 > 520) {
              int cut = Math.min(line.length(), 105);
              while (
                  cut > 1 &&
                  (font.getStringWidth(line.substring(0, cut)) / 1000) * 9 > 520
                )
                cut--;
              stream.showText(line.substring(0, cut));
              stream.newLine();
              line = line.substring(cut);
              count++;
            }
            stream.showText(line);
            stream.newLine();
            count++;
          }
          stream.endText();
          stream.beginText();
          stream.setFont(font, 8);
          stream.newLineAtOffset(36, 28);
          stream.showText("Página " + pageNo);
          stream.endText();
        }
      }
      doc.save(out);
      return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .header("Content-Disposition", "attachment; filename=extrato.pdf")
        .body(out.toByteArray());
    }
  }

  private String seguro(String s, PDFont font) {
    StringBuilder b = new StringBuilder();
    for (char c : s.toCharArray()) {
      if (c < ' ') c = ' ';
      try {
        font.encode(String.valueOf(c));
        b.append(c);
      } catch (Exception ex) {
        b.append('?');
      }
    }
    return b.toString();
  }
}
