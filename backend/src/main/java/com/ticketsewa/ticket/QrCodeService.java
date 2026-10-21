package com.ticketsewa.ticket;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

/**
 * Renders ticket check-in codes as QR images via ZXing. Each ticket's unique
 * code becomes a scannable PNG consumed by the gate check-in flow.
 */
@Service
public class QrCodeService {
  /**
   * Renders the given content (typically a ticket check-in code) as a
   * 320x320 PNG QR code and returns the raw bytes.
   */
  public byte[] png(String content) {
    try {
      var matrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, 320, 320);
      var out = new ByteArrayOutputStream();
      MatrixToImageWriter.writeToStream(matrix, "PNG", out);
      return out.toByteArray();
    } catch (Exception e) {
      throw new IllegalStateException("QR generation failed", e);
    }
  }
}
