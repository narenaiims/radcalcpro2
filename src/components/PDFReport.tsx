import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts for a professional look
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKbxmcjA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2', fontWeight: 700 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2', fontWeight: 900, fontStyle: 'italic' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brand: {
    fontSize: 18,
    fontWeight: 900,
    color: '#0f172a',
  },
  subBrand: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#0f172a',
  },
  date: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 1,
    backgroundColor: '#f1f5f9',
    padding: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    color: '#334155',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 4,
  },
  label: {
    color: '#64748b',
  },
  value: {
    fontWeight: 700,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingVertical: 8,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: 700,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 900,
  },
  unit: {
    fontSize: 10,
    fontWeight: 400,
    marginLeft: 2,
  },
  insight: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: '#cbd5e1',
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
  disclaimer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  disclaimerTitle: {
    fontSize: 8,
    fontWeight: 900,
    color: '#b91c1c',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 7,
    color: '#64748b',
    textAlign: 'justify',
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  checksum: {
    fontSize: 7,
    color: '#94a3b8',
    fontFamily: 'Courier',
  },
  signature: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    textAlign: 'center',
    fontSize: 7,
    fontWeight: 700,
    textTransform: 'uppercase',
    paddingBottom: 2,
  }
});

interface PDFReportProps {
  title: string;
  parameters?: { label: string; value: string | number }[];
  results?: { label: string; value: string | number; unit?: string }[];
  clinicalInsight?: string;
  transparencyPanel?: { label: string; value: string | number }[];
}

export const PDFReport: React.FC<PDFReportProps> = ({ 
  title, parameters, results, clinicalInsight, transparencyPanel 
}) => (
  <Document title={title}>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>RadOnc Pro Portal</Text>
          <Text style={styles.subBrand}>Clinical Physics Decision Support</Text>
        </View>
        <View>
          <Text style={styles.date}>Generated On</Text>
          <Text style={{ fontSize: 10, fontWeight: 700 }}>
            {new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>

      {/* Transparency Panel */}
      {transparencyPanel && transparencyPanel.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Transparency</Text>
          {transparencyPanel.map((f, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.label}>{f.label}</Text>
              <Text style={styles.value}>{f.value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Input Parameters */}
      {parameters && parameters.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input Parameters</Text>
          {parameters.map((f, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.label}>{f.label}</Text>
              <Text style={styles.value}>{f.value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calculated Results</Text>
          {results.map((f, i) => (
            <View key={i} style={styles.resultRow}>
              <Text style={styles.resultLabel}>{f.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={styles.resultValue}>{f.value}</Text>
                <Text style={styles.unit}>{f.unit || ''}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Clinical Insight */}
      {clinicalInsight && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Interpretation</Text>
          <View style={styles.insight}>
            <Text>{clinicalInsight}</Text>
          </View>
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Clinical Safety Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          This report is generated by RadOnc Pro, a decision-support tool intended for use by qualified radiation oncology professionals only. 
          Calculations are based on established radiobiological models but must be independently verified by a second 
          qualified physicist or oncologist before clinical implementation. The authors and developers accept no liability for clinical decisions 
          made based on these outputs. Patient identification must be manually verified. This document is not a prescription. 
          Verify all parameters against site-specific protocols.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.checksum}>
          ID: {Math.random().toString(36).substring(2, 15).toUpperCase()}
        </Text>
        <Text style={styles.signature}>Physicist Signature</Text>
      </View>
    </Page>
  </Document>
);
