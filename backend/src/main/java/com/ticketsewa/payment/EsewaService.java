package com.ticketsewa.payment;

import com.ticketsewa.order.PurchaseOrder;
import org.slf4j.*;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Classic eSewa ePay integration (v1 form flow, still the documented flow for
 * Nepali merchants):
 *  1. We hand the browser a signed set of fields; it POSTs them to eSewa.
 *  2. eSewa charges the wallet and redirects the buyer to our success URL
 *     with ?oid=&amt=&refId=.
 *  3. We MUST verify server-to-server via the transrec API before issuing
 *     tickets — the redirect alone proves nothing.
 */
@Service
public class EsewaService {
  private static final Logger log = LoggerFactory.getLogger(EsewaService.class);
  private final EsewaProperties props;
  private final RestClient http = RestClient.create();

  public EsewaService(EsewaProperties props) {
    this.props = props;
  }

  /** Fields the browser auto-POSTs to eSewa. Amounts are whole NPR. */
  public Map<String, String> buildPaymentForm(PurchaseOrder order) {
    String amt = String.valueOf(order.getAmountNpr());
    return Map.of(
        "amt", amt,
        "psc", "0",
        "pdc", "0",
        "txAmt", "0",
        "tAmt", amt,
        "pid", order.getId(),
        "scd", props.getMerchantCode(),
        "su", props.getSuccessUrl(),
        "fu", props.getFailureUrl()
    );
  }

  public String paymentUrl() {
    return props.getPaymentUrl();
  }

  /**
   * Server-to-server verification. Returns true only when eSewa confirms
   * the transaction. Any transport error -> false (fail closed).
   */
  public boolean verify(String amt, String pid, String refId) {
    var form = new LinkedMultiValueMap<String, String>();
    form.add("amt", amt);
    form.add("scd", props.getMerchantCode());
    form.add("rid", refId);
    form.add("pid", pid);
    try {
      String body = http.post()
          .uri(props.getVerificationUrl())
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .body(form)
          .retrieve()
          .body(String.class);
      boolean ok = body != null && body.contains("Success");
      log.info("eSewa transrec pid={} refId={} -> {}", pid, refId, ok ? "SUCCESS" : "NOT-CONFIRMED");
      return ok;
    } catch (Exception e) {
      log.warn("eSewa verification failed for pid={}: {}", pid, e.getMessage());
      return false;
    }
  }
}
