    // ============================================================================
    // 1. DATABASE TECNICO, PROFILI CAVI (CON UNIPOLARI 1X) E STATO APPLICAZIONE
    // ============================================================================
    const BRAND_SERIES = {
      LEGRAND: [
        { id: "P31_ASO", name: "Legrand P31 Plus — Passerella Asolata (370xx)", code: "LG-370", type: "perforated" },
        { id: "P31_CIE", name: "Legrand P31 Plus — Canale Cieco (372xx)", code: "LG-372", type: "solid" },
        { id: "CABLOFIL", name: "Cablofil CF — Passerella a Filo (CM50/100)", code: "CF-CM", type: "mesh" }
      ],
      OBO: [
        { id: "RKS_MAGIC", name: "OBO RKS-Magic® — Passerella Asolata", code: "OBO-604", type: "perforated" },
        { id: "MKS_MAGIC", name: "OBO MKS-Magic® — Canale Portacavi", code: "OBO-605", type: "solid" },
        { id: "GRM_MAGIC", name: "OBO GR-Magic® — Passerella a Filo", code: "OBO-600", type: "mesh" }
      ],
      BTICINO: [
        { id: "BT_S27", name: "Bticino Serie 27 — Passerella Asolata", code: "BT-S27", type: "perforated" },
        { id: "BT_S28", name: "Bticino Serie 28 — Canale Cieco IP40", code: "BT-S28", type: "solid" }
      ],
      NIEDAX: [
        { id: "NDX_RL", name: "Niedax RL — Passerella Asolata Standard", code: "NDX-RL", type: "perforated" },
        { id: "NDX_RS", name: "Niedax RS — Canale Chiuso Pesante", code: "NDX-RS", type: "solid" }
      ],
      CUSTOM: [
        { id: "CUSTOM_ASO", name: "Custom — Passerella Asolata", code: "CST-P", type: "perforated" },
        { id: "CUSTOM_CIE", name: "Custom — Canale Chiuso", code: "CST-C", type: "solid" }
      ]
    };

    let CABLE_CATALOG = [
      // ==========================================
      // 1. CAVI BT POTENZA UNIPOLARI (FG16M16 / FS17)
      // ==========================================
      { id: "FG16_1X1.5",  cat: "bt_uni", code: "FG16M16-1X1.5",  desc: "Cavo Unipolare BT 1x1.5 mm² FG16M16",   type: "FG16M16", form: "1(1x1,5)", d: 5.8,  w: 0.05, sec: 1.5, cores: 1, iz0: 24,  bendK: 10, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X2.5",  cat: "bt_uni", code: "FG16M16-1X2.5",  desc: "Cavo Unipolare BT 1x2.5 mm² FG16M16",   type: "FG16M16", form: "1(1x2,5)", d: 6.4,  w: 0.07, sec: 2.5, cores: 1, iz0: 32,  bendK: 10, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X4",    cat: "bt_uni", code: "FG16M16-1X4",    desc: "Cavo Unipolare BT 1x4 mm² FG16M16",     type: "FG16M16", form: "1(1x4)",   d: 7.0,  w: 0.09, sec: 4.0, cores: 1, iz0: 42,  bendK: 10, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X6",    cat: "bt_uni", code: "FG16M16-1X6",    desc: "Cavo Unipolare BT 1x6 mm² FG16M16",     type: "FG16M16", form: "1(1x6)",   d: 7.6,  w: 0.11, sec: 6.0, cores: 1, iz0: 54,  bendK: 10, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X10",   cat: "bt_uni", code: "FG16M16-1X10",   desc: "Cavo Unipolare BT 1x10 mm² FG16M16",    type: "FG16M16", form: "1(1x10)",  d: 9.2,  w: 0.17, sec: 10.0,cores: 1, iz0: 75,  bendK: 10, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X16",   cat: "bt_uni", code: "FG16M16-1X16",   desc: "Cavo Unipolare BT 1x16 mm² FG16M16",    type: "FG16M16", form: "1(1x16)",  d: 10.5, w: 0.23, sec: 16.0,cores: 1, iz0: 100, bendK: 10, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X25",   cat: "bt_uni", code: "FG16M16-1X25",   desc: "Cavo Unipolare BT 1x25 mm² FG16M16",    type: "FG16M16", form: "1(1x25)",  d: 12.2, w: 0.33, sec: 25.0,cores: 1, iz0: 135, bendK: 10, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X35",   cat: "bt_uni", code: "FG16M16-1X35",   desc: "Cavo Unipolare BT 1x35 mm² FG16M16",    type: "FG16M16", form: "1(1x35)",  d: 13.5, w: 0.44, sec: 35.0,cores: 1, iz0: 169, bendK: 12, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X50",   cat: "bt_uni", code: "FG16M16-1X50",   desc: "Cavo Unipolare BT 1x50 mm² FG16M16",    type: "FG16M16", form: "1(1x50)",  d: 15.4, w: 0.58, sec: 50.0,cores: 1, iz0: 207, bendK: 12, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X70",   cat: "bt_uni", code: "FG16M16-1X70",   desc: "Cavo Unipolare BT 1x70 mm² FG16M16",    type: "FG16M16", form: "1(1x70)",  d: 17.5, w: 0.81, sec: 70.0,cores: 1, iz0: 268, bendK: 12, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X95",   cat: "bt_uni", code: "FG16M16-1X95",   desc: "Cavo Unipolare BT 1x95 mm² FG16M16",    type: "FG16M16", form: "1(1x95)",  d: 19.8, w: 1.08, sec: 95.0,cores: 1, iz0: 328, bendK: 12, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X120",  cat: "bt_uni", code: "FG16M16-1X120",  desc: "Cavo Unipolare BT 1x120 mm² FG16M16",   type: "FG16M16", form: "1(1x120)", d: 22.0, w: 1.34, sec: 120.0, cores: 1, iz0: 383, bendK: 12, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X150",  cat: "bt_uni", code: "FG16M16-1X150",  desc: "Cavo Unipolare BT 1x150 mm² FG16M16",   type: "FG16M16", form: "1(1x150)", d: 24.2, w: 1.65, sec: 150.0, cores: 1, iz0: 444, bendK: 12, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X185",  cat: "bt_uni", code: "FG16M16-1X185",  desc: "Cavo Unipolare BT 1x185 mm² FG16M16",   type: "FG16M16", form: "1(1x185)", d: 26.8, w: 2.05, sec: 185.0, cores: 1, iz0: 510, bendK: 12, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X240",  cat: "bt_uni", code: "FG16M16-1X240",  desc: "Cavo Unipolare BT 1x240 mm² FG16M16",   type: "FG16M16", form: "1(1x240)", d: 30.2, w: 2.65, sec: 240.0, cores: 1, iz0: 607, bendK: 12, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_1X300",  cat: "bt_uni", code: "FG16M16-1X300",  desc: "Cavo Unipolare BT 1x300 mm² FG16M16",   type: "FG16M16", form: "1(1x300)", d: 33.5, w: 3.30, sec: 300.0, cores: 1, iz0: 703, bendK: 12, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FS17_1X16_GV",cat: "bt_uni", code: "FS17-1X16-PE",   desc: "Conduttore PE Giallo/Verde 1x16 mm² FS17", type: "FS17", form: "1(1x16) PE", d: 7.4, w: 0.18, sec: 16.0, cores: 1, iz0: 76, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35716 Cca-s3,d1,a3" },
      { id: "FS17_1X25_GV",cat: "bt_uni", code: "FS17-1X25-PE",   desc: "Conduttore PE Giallo/Verde 1x25 mm² FS17", type: "FS17", form: "1(1x25) PE", d: 9.2, w: 0.28, sec: 25.0, cores: 1, iz0: 101, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35716 Cca-s3,d1,a3" },
      { id: "FS17_1X35_GV",cat: "bt_uni", code: "FS17-1X35-PE",   desc: "Conduttore PE Giallo/Verde 1x35 mm² FS17", type: "FS17", form: "1(1x35) PE", d: 10.4, w: 0.38, sec: 35.0, cores: 1, iz0: 125, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35716 Cca-s3,d1,a3" },

      // ==========================================
      // 2. CAVI BT POTENZA MULTIPOLARI (FG16OM16 / H07RN-F)
      // ==========================================
      { id: "FG16_2X1.5",  cat: "bt_multi", code: "FG16OM16-2X1.5", desc: "Cavo Multipolare BT 2x1.5 mm² FG16OM16", type: "FG16OM16", form: "1(2x1,5)", d: 10.2, w: 0.14, sec: 1.5, cores: 2, iz0: 22, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 0.6/1kV" },
      { id: "FG16_2X2.5",  cat: "bt_multi", code: "FG16OM16-2X2.5", desc: "Cavo Multipolare BT 2x2.5 mm² FG16OM16", type: "FG16OM16", form: "1(2x2,5)", d: 11.5, w: 0.18, sec: 2.5, cores: 2, iz0: 30, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 0.6/1kV" },
      { id: "FG16_3G1.5",  cat: "bt_multi", code: "FG16OM16-3G1.5", desc: "Cavo Multipolare BT 3G1.5 mm² FG16OM16", type: "FG16OM16", form: "1(3G1,5)", d: 11.0, w: 0.16, sec: 1.5, cores: 2, iz0: 22, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_3G2.5",  cat: "bt_multi", code: "FG16OM16-3G2.5", desc: "Cavo Multipolare BT 3G2.5 mm² FG16OM16", type: "FG16OM16", form: "1(3G2,5)", d: 12.2, w: 0.22, sec: 2.5, cores: 2, iz0: 30, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_3G4",    cat: "bt_multi", code: "FG16OM16-3G4",   desc: "Cavo Multipolare BT 3G4 mm² FG16OM16",   type: "FG16OM16", form: "1(3G4)",   d: 13.8, w: 0.31, sec: 4.0, cores: 2, iz0: 40, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_3G6",    cat: "bt_multi", code: "FG16OM16-3G6",   desc: "Cavo Multipolare BT 3G6 mm² FG16OM16",   type: "FG16OM16", form: "1(3G6)",   d: 15.2, w: 0.42, sec: 6.0, cores: 2, iz0: 51, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_4G1.5",  cat: "bt_multi", code: "FG16OM16-4G1.5", desc: "Cavo Multipolare BT 4G1.5 mm² FG16OM16", type: "FG16OM16", form: "1(4G1,5)", d: 12.0, w: 0.20, sec: 1.5, cores: 3, iz0: 19, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_4G2.5",  cat: "bt_multi", code: "FG16OM16-4G2.5", desc: "Cavo Multipolare BT 4G2.5 mm² FG16OM16", type: "FG16OM16", form: "1(4G2,5)", d: 13.4, w: 0.27, sec: 2.5, cores: 3, iz0: 26, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_4G4",    cat: "bt_multi", code: "FG16OM16-4G4",   desc: "Cavo Multipolare BT 4G4 mm² FG16OM16",   type: "FG16OM16", form: "1(4G4)",   d: 15.2, w: 0.38, sec: 4.0, cores: 3, iz0: 35, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_4G6",    cat: "bt_multi", code: "FG16OM16-4G6",   desc: "Cavo Multipolare BT 4G6 mm² FG16OM16",   type: "FG16OM16", form: "1(4G6)",   d: 16.8, w: 0.52, sec: 6.0, cores: 3, iz0: 45, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_4G10",   cat: "bt_multi", code: "FG16OM16-4G10",  desc: "Cavo Multipolare BT 4G10 mm² FG16OM16",  type: "FG16OM16", form: "1(4G10)",  d: 19.5, w: 0.78, sec: 10.0,cores: 3, iz0: 63, bendK: 10,sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_4G16",   cat: "bt_multi", code: "FG16OM16-4G16",  desc: "Cavo Multipolare BT 4G16 mm² FG16OM16",  type: "FG16OM16", form: "1(4G16)",  d: 22.8, w: 1.15, sec: 16.0,cores: 3, iz0: 85, bendK: 10,sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_4G25",   cat: "bt_multi", code: "FG16OM16-4G25",  desc: "Cavo Multipolare BT 4G25 mm² FG16OM16",  type: "FG16OM16", form: "1(4G25)",  d: 27.2, w: 1.70, sec: 25.0,cores: 3, iz0: 115,bendK: 10,sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_4G35",   cat: "bt_multi", code: "FG16OM16-4G35",  desc: "Cavo Multipolare BT 4G35 mm² FG16OM16",  type: "FG16OM16", form: "1(4G35)",  d: 30.5, w: 2.25, sec: 35.0,cores: 3, iz0: 143,bendK: 10,sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_4G50",   cat: "bt_multi", code: "FG16OM16-4G50",  desc: "Cavo Multipolare BT 4G50 mm² FG16OM16",  type: "FG16OM16", form: "1(4G50)",  d: 35.0, w: 3.10, sec: 50.0,cores: 3, iz0: 178,bendK: 12,sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_5G1.5",  cat: "bt_multi", code: "FG16OM16-5G1.5", desc: "Cavo Multipolare BT 5G1.5 mm² FG16OM16", type: "FG16OM16", form: "1(5G1,5)", d: 13.0, w: 0.24, sec: 1.5, cores: 3, iz0: 19, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_5G2.5",  cat: "bt_multi", code: "FG16OM16-5G2.5", desc: "Cavo Multipolare BT 5G2.5 mm² FG16OM16", type: "FG16OM16", form: "1(5G2,5)", d: 14.5, w: 0.32, sec: 2.5, cores: 3, iz0: 26, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_5G4",    cat: "bt_multi", code: "FG16OM16-5G4",   desc: "Cavo Multipolare BT 5G4 mm² FG16OM16",   type: "FG16OM16", form: "1(5G4)",   d: 16.5, w: 0.45, sec: 4.0, cores: 3, iz0: 35, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_5G6",    cat: "bt_multi", code: "FG16OM16-5G6",   desc: "Cavo Multipolare BT 5G6 mm² FG16OM16",   type: "FG16OM16", form: "1(5G6)",   d: 18.2, w: 0.60, sec: 6.0, cores: 3, iz0: 45, bendK: 8, sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_5G10",   cat: "bt_multi", code: "FG16OM16-5G10",  desc: "Cavo Multipolare BT 5G10 mm² FG16OM16",  type: "FG16OM16", form: "1(5G10)",  d: 21.4, w: 0.92, sec: 10.0,cores: 3, iz0: 63, bendK: 10,sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_5G16",   cat: "bt_multi", code: "FG16OM16-5G16",  desc: "Cavo Multipolare BT 5G16 mm² FG16OM16",  type: "FG16OM16", form: "1(5G16)",  d: 24.8, w: 1.35, sec: 16.0,cores: 3, iz0: 85, bendK: 10,sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "FG16_5G25",   cat: "bt_multi", code: "FG16OM16-5G25",  desc: "Cavo Multipolare BT 5G25 mm² FG16OM16",  type: "FG16OM16", form: "1(5G25)",  d: 29.8, w: 2.05, sec: 25.0,cores: 3, iz0: 115,bendK: 10,sys: "BT_POWER", std: "CEI UNEL 35375 Cca-s3,d1,a3" },
      { id: "H07RN_3G2.5", cat: "bt_multi", code: "H07RN-F-3G2.5",  desc: "Cavo Gomma Neoprene H07RN-F 3G2.5",     type: "H07RN-F",  form: "1(3G2,5)", d: 13.5, w: 0.28, sec: 2.5, cores: 2, iz0: 30, bendK: 8, sys: "BT_POWER", std: "CEI EN 50525-2-21 450/750V" },
      { id: "H07RN_4G4",   cat: "bt_multi", code: "H07RN-F-4G4",    desc: "Cavo Gomma Sommerso Pompa H07RN-F 4G4", type: "H07RN-F",  form: "1(4G4)",   d: 17.5, w: 0.48, sec: 4.0, cores: 3, iz0: 35, bendK: 8, sys: "BT_POWER", std: "CEI EN 50525-2-21 450/750V" },

      // ==========================================
      // 3. CAVI SEGNALI, COMANDO & AUSILIARI (FG16OH2R16 / LiYCY / KNX)
      // ==========================================
      { id: "OH2_2X1",     cat: "signal",   code: "FG16OH2R16-2X1",    desc: "Cavo Segnale Schermato FG16OH2R16 2x1",  type: "FG16OH2R16", form: "1(2x1)",  d: 9.5,  w: 0.13, sec: 1.0, cores: 2, iz0: 15, bendK: 10,sys: "BT_POWER", std: "CEI 20-13 Schermato (Compatibile BT)" },
      { id: "OH2_2X1.5",   cat: "signal",   code: "FG16OH2R16-2X1.5",  desc: "Cavo Segnale Schermato FG16OH2R16 2x1.5",type: "FG16OH2R16", form: "1(2x1,5)",d: 10.2, w: 0.16, sec: 1.5, cores: 2, iz0: 18, bendK: 10,sys: "BT_POWER", std: "CEI 20-13 Schermato (Compatibile BT)" },
      { id: "OH2_4G1.5",   cat: "signal",   code: "FG16OH2R16-4G1.5",  desc: "Cavo Comando Schermato FG16OH2R16 4G1.5", type: "FG16OH2R16", form: "1(4G1,5)",d: 12.2, w: 0.23, sec: 1.5, cores: 3, iz0: 18, bendK: 10,sys: "BT_POWER", std: "CEI 20-13 Schermato (Compatibile BT)" },
      { id: "OH2_7G1.5",   cat: "signal",   code: "FG16OH2R16-7G1.5",  desc: "Cavo Ausiliari Schermato FG16OH2R16 7G1.5",  type: "FG16OH2R16", form: "1(7G1,5)",d: 14.5, w: 0.34, sec: 1.5, cores: 3, iz0: 14, bendK: 10,sys: "BT_POWER", std: "CEI 20-13 Schermato (Compatibile BT)" },
      { id: "OH2_12G1.5",  cat: "signal",   code: "FG16OH2R16-12G1.5", desc: "Cavo Ausiliari Schermato FG16OH2R16 12G1.5",type: "FG16OH2R16", form: "1(12G1,5)",d: 18.2, w: 0.55, sec: 1.5, cores: 3, iz0: 12, bendK: 10,sys: "BT_POWER", std: "CEI 20-13 Schermato (Compatibile BT)" },
      { id: "LIYCY_2X0.75",cat: "signal",   code: "LiYCY-2X0.75",      desc: "Cavo Trasmissione Dati LiYCY 2x0.75",    type: "LiYCY",     form: "2x0,75",   d: 5.8,  w: 0.05, sec: 0.75,cores: 2, iz0: 8,  bendK: 10,sys: "SPECIAL_ELV", std: "DIN 47100 Schermato Treccia" },
      { id: "LIYCY_4X0.75",cat: "signal",   code: "LiYCY-4X0.75",      desc: "Cavo Sonde Temperatura LiYCY 4x0.75",    type: "LiYCY",     form: "4x0,75",   d: 6.8,  w: 0.08, sec: 0.75,cores: 2, iz0: 8,  bendK: 10,sys: "SPECIAL_ELV", std: "DIN 47100 Schermato Treccia" },
      { id: "BUS_KNX",     cat: "signal",   code: "KNX-TP1-2X2X0.8",   desc: "Cavo Bus Domotica KNX TP1 2x2x0.8",      type: "KNX Bus TP1", form: "2x2x0,8", d: 6.8,  w: 0.06, sec: 0.5, cores: 2, iz0: 6,  bendK: 10,sys: "SPECIAL_ELV", std: "CEI EN 50090 Certificato Verde" },

      // ==========================================
      // 4. RESISTENTI AL FUOCO PH120 & SICUREZZA (FTG10OM1 / FTG18OM16 / IRAI / EVAC)
      // ==========================================
      { id: "FTG18_2X1.5", cat: "fire",     code: "FTG18OM16-2X1.5",  desc: "Cavo Resistente al Fuoco PH120 FTG18OM16 2x1.5",   type: "FTG18OM16", form: "1(2x1,5)", d: 10.5, w: 0.15, sec: 1.5, cores: 2, iz0: 22, bendK: 10, sys: "BT_FIRE", std: "CEI 20-45 / UNI 9795 PH120" },
      { id: "FTG18_3G2.5", cat: "fire",     code: "FTG18OM16-3G2.5",  desc: "Cavo Sicurezza Antincendio PH120 FTG18OM16 3G2.5", type: "FTG18OM16", form: "1(3G2,5)", d: 12.8, w: 0.24, sec: 2.5, cores: 2, iz0: 30, bendK: 10, sys: "BT_FIRE", std: "CEI 20-45 / UNI 9795 PH120" },
      { id: "FTG18_4G4",   cat: "fire",     code: "FTG18OM16-4G4",    desc: "Cavo Gruppo Emergenza PH120 FTG18OM16 4G4",        type: "FTG18OM16", form: "1(4G4)",   d: 16.0, w: 0.42, sec: 4.0, cores: 3, iz0: 35, bendK: 10, sys: "BT_FIRE", std: "CEI 20-45 / UNI 9795 PH120" },
      { id: "FTG18_4G10",  cat: "fire",     code: "FTG18OM16-4G10",   desc: "Cavo Pompe Sprinkler PH120 FTG18OM16 4G10",        type: "FTG18OM16", form: "1(4G10)",  d: 20.2, w: 0.85, sec: 10.0,cores: 3, iz0: 63, bendK: 10, sys: "BT_FIRE", std: "CEI 20-45 / UNI 9795 PH120" },
      { id: "IRAI_LOOP",   cat: "fire",     code: "FTG18(O)M16-2X1.5",desc: "Cavo Rivelazione Incendio IRAI FTG18(O)M16 2x1.5",type: "FTG18(O)M16", form: "1(2x1,5)", d: 8.2,  w: 0.09, sec: 1.5, cores: 2, iz0: 15, bendK: 10, sys: "SPECIAL_ELV", std: "CEI 20-105 Rosso Allarme" },
      { id: "EVAC_100V",   cat: "fire",     code: "FTG18(O)M16-2X2.5",desc: "Cavo Diffusione Sonora EVAC FTG18(O)M16 2x2.5",   type: "FTG18(O)M16", form: "1(2x2,5)", d: 9.8, w: 0.14, sec: 2.5, cores: 2, iz0: 20, bendK: 10, sys: "SPECIAL_ELV", std: "EN 54-24 / CEI 20-105 PH120" },

      // ==========================================
      // 5. RETI DATI STRUTTURATE & FIBRA OTTICA
      // ==========================================
      { id: "DATA_CAT6",   cat: "data",     code: "UTP-CAT6-4X2",     desc: "Cavo Dati U/UTP Cat.6 LSZH",        type: "U/UTP Cat.6", form: "4x2x24AWG", d: 5.8,  w: 0.04, sec: 0.5, cores: 2, iz0: 4,  bendK: 8,  sys: "SPECIAL_ELV", std: "ISO/IEC 11801 Class E" },
      { id: "DATA_CAT6A",  cat: "data",     code: "FUTP-CAT6A-4X2",   desc: "Cavo Dati Schermato F/UTP Cat.6A",   type: "F/UTP Cat.6A", form: "4x2x23AWG", d: 7.3, w: 0.06, sec: 0.5, cores: 2, iz0: 5, bendK: 10, sys: "SPECIAL_ELV", std: "ISO/IEC 11801 Class EA" },
      { id: "DATA_CAT7",   cat: "data",     code: "SFTP-CAT7-4X2",    desc: "Dorsale Dati S/FTP Cat.7 LSZH",     type: "S/FTP Cat.7", form: "4x2x23AWG", d: 8.2, w: 0.07, sec: 0.5, cores: 2, iz0: 5, bendK: 10, sys: "SPECIAL_ELV", std: "ISO/IEC 11801 Class F" },
      { id: "FO_4_OM4",    cat: "data",     code: "FO-OM4-4X",        desc: "Fibra Ottica Breakout 4 FO OM4 50/125",type: "FO Breakout 4x", form: "4 FO 50/125", d: 6.2, w: 0.04, sec: 0.2, cores: 2, iz0: 1, bendK: 12, sys: "SPECIAL_ELV", std: "CEI EN 60794-2" },
      { id: "FO_8_OM4",    cat: "data",     code: "FO-OM4-8X",        desc: "Fibra Ottica Breakout 8 FO OM4 50/125",type: "FO Breakout 8x", form: "8 FO 50/125", d: 7.8, w: 0.06, sec: 0.2, cores: 2, iz0: 1, bendK: 12, sys: "SPECIAL_ELV", std: "CEI EN 60794-2" },
      { id: "FO_12_OS2",   cat: "data",     code: "FO-OS2-12X",       desc: "Fibra Ottica Monomodale 12 FO OS2 9/125",type: "FO Loose 12x", form: "12 FO 9/125", d: 7.0, w: 0.05, sec: 0.2, cores: 2, iz0: 1, bendK: 12, sys: "SPECIAL_ELV", std: "ITU-T G.652.D / EN 60794" },
      { id: "FO_24_OS2",   cat: "data",     code: "FO-24OS2",         desc: "Fibra Ottica Monomodale 24 FO OS2 9/125",type: "FO Loose 24x", form: "24 FO 9/125", d: 8.5, w: 0.07, sec: 0.2, cores: 2, iz0: 1, bendK: 12, sys: "SPECIAL_ELV", std: "ITU-T G.652.D / EN 60794" }
    ];

    // Registrazione dinamica automatica di nuovi cavi non presenti nel catalogo (Punto 1)
    function registerCableInCatalog(c) {
      if (!c) return null;
      const normType = String(c.type || "FG16M16").trim();
      const normForm = String(c.form || "1(3G2,5)").trim();
      const d = +(c.d || 12.0).toFixed(1);
      const isUni = isUnipolarCable(c);
      const sec = c.sec || parseSectionFromForm(normForm, 2.5);

      // Cerca se esiste già nel catalogo per tipo e formazione oppure per codice/id cavo
      const candidateCode = String(c.siglaCavo || c.cableCode || "").trim();
      const isUtenzaLike = (s) => /^(?:[A-Z0-9]{2,12}(?:[-._/][A-Z0-9]{1,10})*\s+)?C-?\d+$/i.test(s) ||
                                  /^(?:QGBT|QP|QE|QUADRO|UPS|IRAI|EVAC|TD)[A-Z0-9_.-]*/i.test(s) ||
                                  /^#\d+/i.test(s) || /^Alimentazione/i.test(s);

      let existing = null;
      if (candidateCode && !isUtenzaLike(candidateCode)) {
        const found = CABLE_CATALOG.find(it => it.code.toUpperCase() === candidateCode.toUpperCase() || it.id.toUpperCase() === candidateCode.toUpperCase());
        if (found && Math.abs(found.d - d) < 0.2) {
          existing = found;
        }
      }
      if (!existing) {
        existing = CABLE_CATALOG.find(it =>
          it.type.toUpperCase() === normType.toUpperCase() &&
          it.form.toUpperCase() === normForm.toUpperCase() &&
          Math.abs(it.d - d) < 0.2
        );
      }
      if (existing) return existing;

      const w = c.w || +(Math.pow(d / 10, 2) * 0.145).toFixed(2);
      const cores = isUni ? 1 : (c.cores || (normForm.includes("5G") || normForm.includes("4G") ? 3 : 2));
      const sys = c.sys || (/IRAI|EVAC|KNX|BUS|FIBRA|CAT|UTP|FTP/i.test(normType) ? "SPECIAL_ELV" : "BT_POWER");
      const cat = sys === "SPECIAL_ELV" ? "signal" : isUni ? "bt_uni" : "bt_multi";

      // Generazione di una sigla cavo univoca tecnica (senza riferimenti alle sigle utenza come da specifica)
      let baseCode = (candidateCode && !isUtenzaLike(candidateCode))
        ? candidateCode.toUpperCase().replace(/[^a-zA-Z0-9_-]+/g, "_")
        : `${normType}-${normForm.replace(/[^a-zA-Z0-9,.]+/g, "")}`.toUpperCase();
      
      let uniqueCode = baseCode;
      let counter = 1;
      while (CABLE_CATALOG.some(it => it.code.toUpperCase() === uniqueCode.toUpperCase() || it.id.toUpperCase() === `CST_${uniqueCode.replace(/[^a-zA-Z0-9]+/g, "_")}`.toUpperCase())) {
        uniqueCode = `${baseCode}_${counter++}`;
      }
      const newId = `CST_${uniqueCode.replace(/[^a-zA-Z0-9]+/g, "_")}`;

      const newEntry = {
        id: newId,
        cat,
        code: uniqueCode,
        desc: (c.desc && !isUtenzaLike(c.desc)) ? c.desc : `Cavo ${normType} ${normForm} (Ø=${d}mm, ${sec}mm²)`,
        type: normType,
        form: normForm,
        d,
        w,
        sec,
        cores,
        iz0: c.iz0 || (sec >= 50 ? 200 : sec >= 16 ? 100 : sec >= 6 ? 54 : sec >= 2.5 ? 32 : 18),
        bendK: c.bendK || (isUni ? 10 : 8),
        sys,
        std: "Aggiunto automaticamente da file/input"
      };

      CABLE_CATALOG.push(newEntry);
      if (typeof initCatalogDropdown === "function") initCatalogDropdown();
      if (typeof renderCatalogTable === "function") renderCatalogTable();
      const countEl = document.getElementById("dbItemsCount");
      if (countEl) countEl.textContent = `${CABLE_CATALOG.length} modelli certificati disponibili`;
      const banner = document.getElementById("statusBanner");
      if (banner) {
        banner.textContent = `✓ Nuova tipologia cavo registrata nel DB: ${uniqueCode} (Ø=${d}mm, ${sec}mm²)`;
        banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold";
      }
      return newEntry;
    }

    // Mappa granulare basata sul diametro reale (mm) secondo tabelle dimensionali CEI UNEL 35310 / Prysmian / Baldassari
    // NOTA NORMATIVA: I cavi importati sono SEMPRE BT (sys: "BT_POWER"), salvo esplicita presenza di sigle di segnale/speciali.
    function inferCableSpecsByDiameter(d, codeStr = "", layerStr = "") {
      const combined = (String(codeStr || "") + " " + String(layerStr || "")).toUpperCase();
      
      // Controllo esplicito di cavi ausiliari / segnali / reti speciali
      const isExplicitSignal = /(?:IRAI|FUMI|LOOP|EVAC|SPK|DIFFUS|CAT\s*[567]|DATI|LAN|UTP|FTP|BUS|KNX|FONIA|FIBRA|ELV|SEGNAL|SONOR)/i.test(combined);
      const isExplicitFire = /(?:FTG10|FTG18|RESIST|INCEND|TAGLIAFUOCO|REI)/i.test(combined);

      if (isExplicitSignal) {
        if (/IRAI|FUMI|LOOP/i.test(combined)) {
          return { type: "FTG18(O)M16", form: "1(2x1,5)", sec: 1.5, cores: 2, iz0: 15, bendK: 10, sys: "SPECIAL_ELV" };
        }
        if (/EVAC|SPK|DIFFUS|SONOR/i.test(combined)) {
          return { type: "FTG18(O)M16", form: "1(2x2,5)", sec: 2.5, cores: 2, iz0: 20, bendK: 10, sys: "SPECIAL_ELV" };
        }
        if (/BUS|KNX/i.test(combined)) {
          return { type: "KNX Bus TP1", form: "2x2x0,8", sec: 0.5, cores: 2, iz0: 6, bendK: 10, sys: "SPECIAL_ELV" };
        }
        if (/FIBRA/i.test(combined)) {
          return { type: "Fibra Ottica", form: "8 FO OM4", sec: 0.2, cores: 2, iz0: 1, bendK: 12, sys: "SPECIAL_ELV" };
        }
        return { type: "F/UTP Cat.6A", form: "4x2x23AWG", sec: 0.5, cores: 2, iz0: 5, bendK: 10, sys: "SPECIAL_ELV" };
      }

      if (isExplicitFire) {
        if (d <= 14.5) return { type: "FTG18OM16", form: "1(3G2,5)", sec: 2.5, cores: 2, iz0: 27, bendK: 10, sys: "BT_FIRE" };
        if (d <= 18.0) return { type: "FTG18OM16", form: "1(4G4)",   sec: 4.0, cores: 3, iz0: 36, bendK: 10, sys: "BT_FIRE" };
        return { type: "FTG18OM16", form: "1(4G10)",  sec: 10.0, cores: 3, iz0: 60, bendK: 10, sys: "BT_FIRE" };
      }

      // TUTTI GLI ALTRI CAVI SONO SEMPRE BASSA TENSIONE (BT_POWER)
      // Mappatura continua secondo tabelle dimensionali standard CEI UNEL 35375 / CEI 20-22
      if (d <= 6.8)  return { type: "FS17",     form: "1(1x2,5)", sec: 2.5,  cores: 1, iz0: 24,  bendK: 8,  sys: "BT_POWER" };
      if (d <= 7.8)  return { type: "FS17",     form: "1(1x4)",   sec: 4.0,  cores: 1, iz0: 32,  bendK: 8,  sys: "BT_POWER" };
      if (d <= 8.8)  return { type: "FS17",     form: "1(1x6)",   sec: 6.0,  cores: 1, iz0: 42,  bendK: 8,  sys: "BT_POWER" };
      if (d <= 9.8)  return { type: "FG16M16",  form: "1(1x10)",  sec: 10.0, cores: 1, iz0: 75,  bendK: 10, sys: "BT_POWER" };
      if (d <= 10.8) return { type: "FG16M16",  form: "1(1x16)",  sec: 16.0, cores: 1, iz0: 100, bendK: 10, sys: "BT_POWER" };
      if (d <= 11.6) return { type: "FG16OM16", form: "1(3G1,5)", sec: 1.5,  cores: 2, iz0: 22,  bendK: 8,  sys: "BT_POWER" };
      if (d <= 12.8) return { type: "FG16M16",  form: "1(1x25)",  sec: 25.0, cores: 1, iz0: 135, bendK: 10, sys: "BT_POWER" };
      if (d <= 13.5) return { type: "FG16OM16", form: "1(4G1,5)", sec: 1.5,  cores: 3, iz0: 19,  bendK: 8,  sys: "BT_POWER" };
      if (d <= 14.4) return { type: "FG16OM16", form: "1(3G2,5)", sec: 2.5,  cores: 2, iz0: 30,  bendK: 8,  sys: "BT_POWER" };
      if (d <= 15.2) return { type: "FG16OM16", form: "1(5G2,5)", sec: 2.5,  cores: 3, iz0: 26,  bendK: 8,  sys: "BT_POWER" };
      if (d <= 16.0) return { type: "FG16OM16", form: "1(3G4)",   sec: 4.0,  cores: 2, iz0: 40,  bendK: 8,  sys: "BT_POWER" };
      if (d <= 17.2) return { type: "FG16OM16", form: "1(5G4)",   sec: 4.0,  cores: 3, iz0: 35,  bendK: 8,  sys: "BT_POWER" };
      if (d <= 18.2) return { type: "FG16OM16", form: "1(5G6)",   sec: 6.0,  cores: 3, iz0: 45,  bendK: 8,  sys: "BT_POWER" };
      if (d <= 20.5) return { type: "FG16M16",  form: "1(1x95)",  sec: 95.0, cores: 1, iz0: 328, bendK: 12, sys: "BT_POWER" };
      if (d <= 21.8) return { type: "FG16OM16", form: "1(5G10)",  sec: 10.0, cores: 3, iz0: 63,  bendK: 10, sys: "BT_POWER" };
      if (d <= 23.5) return { type: "FG16M16",  form: "1(1x120)", sec: 120.0, cores: 1, iz0: 383, bendK: 12, sys: "BT_POWER" };
      if (d <= 25.0) return { type: "FG16OM16", form: "1(5G16)",  sec: 16.0, cores: 3, iz0: 85,  bendK: 10, sys: "BT_POWER" };
      if (d <= 27.5) return { type: "FG16M16",  form: "1(1x185)", sec: 185.0, cores: 1, iz0: 510, bendK: 12, sys: "BT_POWER" };
      if (d <= 31.0) return { type: "FG16M16",  form: "1(1x240)", sec: 240.0, cores: 1, iz0: 607, bendK: 12, sys: "BT_POWER" };
      if (d <= 35.0) return { type: "FG16M16",  form: "1(1x300)", sec: 300.0, cores: 1, iz0: 703, bendK: 12, sys: "BT_POWER" };
      return { type: "FG16M16", form: "1(1x400)", sec: 400.0, cores: 1, iz0: 823, bendK: 12, sys: "BT_POWER" };
    }

    // Determina se un cavo è Unipolare (es. "1x...", "4(1x10)", "FG16M16", "FS17")
    function isUnipolarCable(c) {
      const f = String(c.form || "").toUpperCase();
      const t = String(c.type || "").toUpperCase();
      return /\b1X\d+|\(\s*1X\d+/i.test(f) || /\bFG16M16\b|\bFS17\b|\bFG17\b|\bH07Z1-K\b/i.test(t) || c.cores === 1;
    }

    // Estrae la sezione nominale in mm² da una stringa formazione con fix standard metrico
    function parseSectionFromForm(formStr, fallbackSec = 2.5) {
      if (/AWG/i.test(formStr)) return fallbackSec;
      const m = String(formStr || "").match(/[xXGg](\d+(?:[.,]\d+)?)/);
      if (m) {
        let val = parseFloat(m[1].replace(",", "."));
        const standardSections = [0.5, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630];
        let closest = standardSections.reduce((prev, curr) => 
          Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
        );
        return closest;
      }
      return fallbackSec;
    }

    const SUPPORT_SPECS = {
      none: {
        name: "No Staffaggio",
        desc: "Nessun supporto CAD o mensola prevista per questo tratto di canalizzazione",
        swl10m: 0, swl15m: 0, swl20m: 0, swl25m: 0, swl30m: 0,
        armH: 0, strut: false, type: "none"
      },
      wall_light: {
        name: "Mensola Parete Leggera C30",
        desc: "Profilato a C 30x15 sp.1.5mm, fissaggio a parete con 1 tassello M8, indicata per carichi leggeri e segnali",
        swl10m: 55, swl15m: 35, swl20m: 22, swl25m: 14, swl30m: 10,
        armH: 8, strut: false, type: "wall"
      },
      wall_med: {
        name: "Mensola Rinforzata con Saetta",
        desc: "Braccio profilato 40x20 sp.2.0mm con saetta diagonale di rinforzo saldata, fissaggio a 2 tasselli M10",
        swl10m: 120, swl15m: 75, swl20m: 50, swl25m: 35, swl30m: 24,
        armH: 10, strut: true, type: "wall"
      },
      wall_heavy: {
        name: "Mensola Parete Pesante Doppia C50",
        desc: "Doppio profilato a C 50x30 sp.2.5mm con tirante superiore e piastra 4 fori M12 per canalizzazioni pesanti",
        swl10m: 240, swl15m: 150, swl20m: 100, swl25m: 75, swl30m: 55,
        armH: 14, strut: true, type: "wall"
      },
      ceiling_trap: {
        name: "Trapezio Soffitto 2xM10 + C40",
        desc: "Traversina a C 40x40 sospesa con 2 barre filettate M10 ancorate a solaio con tasselli chimici / antisfilamento",
        swl10m: 320, swl15m: 210, swl20m: 145, swl25m: 105, swl30m: 80,
        armH: 12, strut: false, type: "ceiling"
      },
      ceiling_single: {
        name: "Pendino Centrale Monotirante M10",
        desc: "Sospensione centrale a singola barra filettata M10 con bilancino basculante per canali compatti (L max 200mm)",
        swl10m: 70, swl15m: 45, swl20m: 30, swl25m: 20, swl30m: 12,
        armH: 10, strut: false, type: "ceiling"
      },
      floor_omega: {
        name: "Supporto a Pavimento su Omega C40",
        desc: "Profilato a Omega con piastre di base e piedini antivibranti in gomma per canalizzazioni a pavimento flottante / CED",
        swl10m: 260, swl15m: 180, swl20m: 130, swl25m: 95, swl30m: 70,
        armH: 15, strut: false, type: "floor"
      }
    };

    const MAT_SPECS = {
      sendzimir: { name: "Acciaio Zincato Sendzimir (UNI EN 10346)", stroke: "#94a3b8", fill: "#334155", aci: 8 },
      hdg:       { name: "Acciaio Zincato a Caldo HDG (EN 1461)", stroke: "#cbd5e1", fill: "#475569", aci: 9 },
      inox304:   { name: "Acciaio Inox AISI 304 Satinato", stroke: "#67e8f9", fill: "#164e63", aci: 4 },
      inox316:   { name: "Acciaio Inox AISI 316L Marino", stroke: "#38bdf8", fill: "#0c4a6e", aci: 5 },
      ral7035:   { name: "Verniciato Polveri RAL 7035", stroke: "#e2e8f0", fill: "#64748b", aci: 7 },
      ral3000:   { name: "Verniciato RAL 3000 Antincendio", stroke: "#f87171", fill: "#991b1b", aci: 1 }
    };

    let state = {
      pdfLoaded: false,
      theme: "dark",
      brand: "LEGRAND",
      seriesId: "P31_ASO",
      title: "NUOVA CANALINA 01 - L=200mm H=75mm",
      planTag: "SEZ. A-A | H=+3.20m",
      width: 200,
      height: 75,
      thk: 1.5,
      lengthM: 30,
      bends90: 0,
      tees: 0,
      reducers: 0,
      seismic: "none",
      trayType: "perforated",
      packing: "gravity",
      material: "sendzimir",
      cover: "snap",
      septums: 0,
      septumPositions: [],
      earth: "gv16",
      clearance: 150,
      reiCount: 0,
      edgeGuard: true,
      clamps: false,
      showIso3D: true,
      showPlanTag: false,
      showTableDesc: true,
      hideTableDesc: false,
      layoutMode: "standard",
      showCableCallouts: true,
      support: "none",
      spanM: 1.5,
      scale: "1:1",
      textScale: parseFloat(safeStorage.get("canaloCAD_textScale")) || 1.0,
      showLoadChart: true,
      showBOM: true,
      showCartiglio: true,
      tb: { client: "PROGETTO ESECUTIVO", project: "IMPIANTI ELETTRICI E SPECIALI", docCode: "PE-IMP-EL-PART-02", author: "STUDIO TECNICO", checker: "RESPONSABILE TECNICO", rev: "Rev. 00", date: new Date().toLocaleDateString("it-IT"), scaleRev: "Scala 1:1 - Rev.00" },
      cables: []
    };

    let unifilareDict = {};
    let metrics = {
      fillPct: 0, sparePct: 100, kr: 1, totalKgM: 0, qMaxKgM: 50,
      pointLoad: 0, maxPoint: 75, loadPct: 0,
      deflectionMm: 0.4, maxDeflectionMm: 7.5,
      pullDaN: 0, maxPullDaN: 100, maxBendR: 0, critCode: "-", fitR: 150,
      jouleWm: 0, maxDv: 0, bom: []
    };

    // Normalizza una sigla linea per garantire l'accoppiamento esatto tra DWG e PDF Unifilare
    function normalizeLineKey(str) {
      return String(str || "")
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();
    }

    // Estrae il codice circuito base eliminando suffissi di fase / polo / conduttore unipolare
    function getBaseCircuitCode(str) {
      let s = String(str || "").trim();
      // Elimina indicazioni di formazione inline tra parentesi, es: " (4(1x10))" o " (1x185)"
      s = s.replace(/\s*\(\s*\d*\(?\d+[xXGg]\d+(?:[.,]\d+)?\)?\s*\)\s*$/i, "").trim();
      // Non tocca sigle temporanee generiche come CAVO-1 se iniziano con CAVO-
      if (/^CAVO-\d+$/i.test(s)) return s;
      // Elimina suffissi conduttore: es. - L1, -L2, L3, _N, - PE, (L1), (PE), .1, /2, (1), ecc.
      // ma NON intacca numerazioni di circuito come C-3 o C-12
      s = s.replace(/(?:[-_/\s]+(?:(?:FASE|COND|POLO)\s*)?(?:L[123]|F[123]|R|S|T|N|PE|TERRA)|[./]\d+|\(\s*(?:L[123]|F[123]|R|S|T|N|PE|TERRA|[1-9])\s*\))$/i, "").trim();
      return s;
    }

    function findInUnifilareDict(codeStr) {
      if (!codeStr) return null;
      const k1 = normalizeLineKey(codeStr);
      if (unifilareDict[k1]) return unifilareDict[k1];
      
      const base = getBaseCircuitCode(codeStr);
      const kBase = normalizeLineKey(base);
      if (unifilareDict[kBase]) return unifilareDict[kBase];

      // Fallback compatto senza spazi o caratteri speciali
      const kCompact = k1.replace(/[^A-Z0-9]/g, "");
      const kBaseCompact = kBase.replace(/[^A-Z0-9]/g, "");
      for (const [k, val] of Object.entries(unifilareDict)) {
        const c = k.replace(/[^A-Z0-9]/g, "");
        if (c === kCompact || c === kBaseCompact) return val;
      }

      // Ricerca robusta per numero di circuito (es. DWG "QGBT-C C-3 - L1" -> PDF "C-3" o "C3")
      const mCirc = base.match(/\b(?:C|L)-?(\d+)\b/i) || codeStr.match(/\b(?:C|L)-?(\d+)\b/i);
      if (mCirc) {
        const num = parseInt(mCirc[1], 10);
        for (const [k, val] of Object.entries(unifilareDict)) {
          const mk = k.match(/\b(?:C|L)-?(\d+)\b/i);
          if (mk && parseInt(mk[1], 10) === num) return val;
        }
      }
      return null;
    }

    function calcAllowedLinearLoadKgM(supportKey, spanM) {
      if (!supportKey || supportKey === "none") return 0;
      const spec = SUPPORT_SPECS[supportKey] || SUPPORT_SPECS.wall_med;
      const baseKgMAt15 = (spec.swl15m || 75) / 1.5;
      const hFactor = Math.pow(state.height / 75, 0.35) * Math.pow(state.thk / 1.5, 0.5);
      return +(baseKgMAt15 * Math.pow(1.5 / spanM, 1.55) * hFactor).toFixed(1);
    }

    function calcElasticDeflectionMm(qTotKgM, supportKey, spanM) {
      if (!supportKey || supportKey === "none") return 0;
      const qAmm = calcAllowedLinearLoadKgM(supportKey, spanM);
      const fLim = Math.min(10.0, (spanM * 1000) / 200);
      return +Math.min(25.0, fLim * (qTotKgM / Math.max(1, qAmm))).toFixed(2);
    }

