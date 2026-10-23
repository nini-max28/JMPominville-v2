import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Vérifie que la requête vient d'une personne connectée avec le bon compte
async function isAuthorized(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data || !data.user) return false;

  const allowedEmail = Deno.env.get("ALLOWED_EMAIL");
  if (allowedEmail) {
    const userEmail = (data.user.email || "").toLowerCase();
    if (userEmail !== allowedEmail.toLowerCase()) return false;
  }
  return true;
}

// ========== CONVERSION ENTRE LE FORMAT DE L'APP (camelCase) ET SUPABASE (snake_case) ==========

function clientToDb(c: any) {
  return {
    id: Math.round(c.id),
    name: c.name || "",
    phone: c.phone || "",
    phone2: c.phone2 || "",
    email: c.email || "",
    type: c.type || "",
    address: c.address || "",
    billing_address: c.billingAddress || "",
    payment_structure: c.paymentStructure || "2",
    first_payment_date: c.firstPaymentDate || "",
    first_payment_method: c.firstPaymentMethod || "",
    first_payment_received: !!c.firstPaymentReceived,
    second_payment_date: c.secondPaymentDate || "",
    second_payment_method: c.secondPaymentMethod || "",
    second_payment_received: !!c.secondPaymentReceived,
    third_payment_date: c.thirdPaymentDate || "",
    third_payment_method: c.thirdPaymentMethod || "",
    third_payment_received: !!c.thirdPaymentReceived,
    fourth_payment_date: c.fourthPaymentDate || "",
    fourth_payment_method: c.fourthPaymentMethod || "",
    fourth_payment_received: !!c.fourthPaymentReceived,
    notes: c.notes || "",
    payment_reminder_sent_at: c.paymentReminderSentAt || null,
    late_payment_warning_sent_at: c.latePaymentWarningSentAt || null,
  };
}

function clientFromDb(c: any) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    phone2: c.phone2,
    email: c.email,
    type: c.type,
    address: c.address,
    billingAddress: c.billing_address,
    paymentStructure: c.payment_structure,
    firstPaymentDate: c.first_payment_date,
    firstPaymentMethod: c.first_payment_method,
    firstPaymentReceived: c.first_payment_received,
    secondPaymentDate: c.second_payment_date,
    secondPaymentMethod: c.second_payment_method,
    secondPaymentReceived: c.second_payment_received,
    thirdPaymentDate: c.third_payment_date,
    thirdPaymentMethod: c.third_payment_method,
    thirdPaymentReceived: c.third_payment_received,
    fourthPaymentDate: c.fourth_payment_date,
    fourthPaymentMethod: c.fourth_payment_method,
    fourthPaymentReceived: c.fourth_payment_received,
    notes: c.notes,
    paymentReminderSentAt: c.payment_reminder_sent_at,
    latePaymentWarningSentAt: c.late_payment_warning_sent_at,
  };
}

function contractToDb(c: any) {
  return {
    id: Math.round(c.id),
    client_id: c.clientId,
    type: c.type || "",
    start_date: c.startDate || "",
    end_date: c.endDate || "",
    amount: c.amount || 0,
    status: c.status || "actif",
    notes: c.notes || "",
    entrees_completes: c.entreesCompletes || 0,
    devants_tempo: c.devantsTempo || 0,
    stationnements_commerciaux: c.stationnementsCommerciaux || 0,
    instructions_entrees: c.instructionsEntrees || "",
    instructions_tempo: c.instructionsTempo || "",
    instructions_commercial: c.instructionsCommercial || "",
    created_at: c.createdAt || null,
    renewed_from: c.renewedFrom || null,
    archived: !!c.archived,
    not_renewed: !!c.notRenewed,
    year_archived: c.yearArchived || null,
    archived_date: c.archivedDate || null,
  };
}

function contractFromDb(c: any) {
  return {
    id: c.id,
    clientId: c.client_id,
    type: c.type,
    startDate: c.start_date,
    endDate: c.end_date,
    amount: c.amount,
    status: c.status,
    notes: c.notes,
    entreesCompletes: c.entrees_completes,
    devantsTempo: c.devants_tempo,
    stationnementsCommerciaux: c.stationnements_commerciaux,
    instructionsEntrees: c.instructions_entrees,
    instructionsTempo: c.instructions_tempo,
    instructionsCommercial: c.instructions_commercial,
    createdAt: c.created_at,
    renewedFrom: c.renewed_from,
    archived: c.archived,
    notRenewed: c.not_renewed,
    yearArchived: c.year_archived,
    archivedDate: c.archived_date,
  };
}

function paymentToDb(p: any) {
  return {
    id: Math.round(p.id),
    client_id: p.clientId,
    contract_id: p.contractId || null,
    payment_number: p.paymentNumber,
    amount: p.amount || 0,
    date: p.date || "",
    payment_method: p.paymentMethod || "",
    cheque_number: p.chequeNumber || "",
    received: p.received !== false,
    deposited: !!p.deposited,
    deposit_date: p.depositDate || null,
    recorded_at: p.recordedAt || null,
    auto_marked: !!p.autoMarked,
  };
}

function paymentFromDb(p: any) {
  return {
    id: p.id,
    clientId: p.client_id,
    contractId: p.contract_id,
    paymentNumber: p.payment_number,
    amount: p.amount,
    date: p.date,
    paymentMethod: p.payment_method,
    chequeNumber: p.cheque_number,
    received: p.received,
    deposited: p.deposited,
    depositDate: p.deposit_date,
    recordedAt: p.recorded_at,
    autoMarked: p.auto_marked,
  };
}

function invoiceToDb(inv: any) {
  return {
    id: Math.round(inv.id),
    client_id: inv.clientId || null,
    amount: inv.amount || 0,
    date: inv.date || "",
    type: inv.type || "",
    description: inv.description || "",
  };
}

function invoiceFromDb(inv: any) {
  return {
    id: inv.id,
    clientId: inv.client_id,
    amount: inv.amount,
    date: inv.date,
    type: inv.type,
    description: inv.description,
  };
}

// Récupère TOUTES les lignes d'une table, sans la limite de 1000 lignes de Supabase
async function fetchAllRows(tableName: string) {
  let allRows: any[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows = allRows.concat(data);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Accès réservé : seulement une personne connectée avec le bon compte
  if (!(await isAuthorized(req))) {
    return Response.json(
      { success: false, error: "Non autorisé" },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    if (req.method === "POST") {
      const incoming = await req.json();
      const clients = incoming.clients || [];
      const contracts = incoming.contracts || [];
      const invoices = incoming.invoices || [];
      const payments = incoming.payments || [];
      const realLastModified = incoming.lastModified || new Date().toISOString();

      await supabase.from("sync_meta").upsert({ id: 1, last_modified: realLastModified });

      if (clients.length > 0) {
        const { error } = await supabase.from("clients").upsert(clients.map(clientToDb), { onConflict: "id" });
        if (error) throw error;
      }
      if (contracts.length > 0) {
        const { error } = await supabase.from("contracts").upsert(contracts.map(contractToDb), { onConflict: "id" });
        if (error) throw error;
      }
      if (payments.length > 0) {
        const paymentsMapped = payments.map(paymentToDb);
        const paymentsDeduped = Array.from(new Map(paymentsMapped.map((p: any) => [p.id, p])).values());

        const existingPayments = await fetchAllRows("payments");
        const existingContractIds = new Map(existingPayments.map((p: any) => [p.id, p.contract_id]));

        const paymentsProtected = paymentsDeduped.map((p: any) => {
          if (!p.contract_id && existingContractIds.has(p.id) && existingContractIds.get(p.id)) {
            return { ...p, contract_id: existingContractIds.get(p.id) };
          }
          return p;
        });

        const { error } = await supabase.from("payments").upsert(paymentsProtected, { onConflict: "id" });
        if (error) throw error;
      }
      if (invoices.length > 0) {
        const invoicesMapped = invoices.map(invoiceToDb);
        const invoicesDeduped = Array.from(new Map(invoicesMapped.map((inv: any) => [inv.id, inv])).values());
        const { error } = await supabase.from("invoices").upsert(invoicesDeduped, { onConflict: "id" });
        if (error) throw error;
      }

      return Response.json({
        success: true,
        message: "Données synchronisées avec succès (Supabase)",
        counts: {
          clients: clients.length,
          contracts: contracts.length,
          invoices: invoices.length,
          payments: payments.length,
        },
        savedAt: new Date().toISOString(),
      }, { headers: corsHeaders });
    }

    if (req.method === "GET") {
      const [allClients, allContracts, allPayments, allInvoices, metaRes] = await Promise.all([
        fetchAllRows("clients"),
        fetchAllRows("contracts"),
        fetchAllRows("payments"),
        fetchAllRows("invoices"),
        supabase.from("sync_meta").select("*").eq("id", 1).maybeSingle(),
      ]);

      const data = {
        clients: allClients.map(clientFromDb),
        contracts: allContracts.map(contractFromDb),
        payments: allPayments.map(paymentFromDb),
        invoices: allInvoices.map(invoiceFromDb),
        notificationsHistory: [],
        lastModified: metaRes.data?.last_modified || null,
      };

      if (data.clients.length === 0 && data.contracts.length === 0) {
        return Response.json(
          { success: false, error: "Aucune donnée sauvegardée trouvée sur le serveur." },
          { status: 404, headers: corsHeaders }
        );
      }

      return Response.json({ success: true, data }, { headers: corsHeaders });
    }

    return Response.json(
      { success: false, error: "Méthode non supportée" },
      { status: 405, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Erreur /sync:", (error as Error).message);
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
});
