import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function NightReceipt() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Navigation Header - Fixed Error & Removed Back Logic */}
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtnContainer}>
          <Text style={styles.closeX}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>SUMMARY</Text>
        <View style={{ width: 40 }} /> {/* Spacer to keep title centered */}
      </View>

      <View style={styles.receiptContainer}>
        <View style={styles.receiptPaper}>
          <View style={styles.innerContent}>
            <Text style={styles.brandName}>SIPSAFE™</Text>
            <Text style={styles.merchantInfo}>STATION #402 — NYC, NY</Text>
            <Text style={styles.merchantInfo}>FEB 21, 2026 01:24 PM</Text>
            
            <View style={styles.dottedDivider} />

            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>ITEM</Text>
              <Text style={styles.tableHeaderText}>QTY</Text>
              <Text style={styles.tableHeaderText}>BAC</Text>
            </View>

            <View style={styles.itemRow}>
              <Text style={styles.itemMain}>Espresso Martini</Text>
              <Text style={styles.itemQty}>02</Text>
              <Text style={styles.itemBac}>.021</Text>
            </View>
            <View style={styles.itemRow}>
              <Text style={styles.itemMain}>Tequila Shot</Text>
              <Text style={styles.itemQty}>01</Text>
              <Text style={styles.itemBac}>.014</Text>
            </View>
            <View style={styles.itemRow}>
              <Text style={styles.itemMain}>Club Soda (W)</Text>
              <Text style={styles.itemQty}>01</Text>
              <Text style={styles.itemBac}>.000</Text>
            </View>

            <View style={styles.dottedDivider} />

            <View style={styles.totalBlock}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL DRINKS</Text>
                <Text style={styles.totalValue}>04</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>PEAK ESTIMATE</Text>
                <Text style={styles.totalValue}>0.042%</Text>
              </View>
            </View>

            <View style={styles.dottedDivider} />

            <View style={styles.barcodeArea}>
              <View style={styles.barcodeMocks} />
              <Text style={styles.serialNumber}>#8821-9930-4410</Text>
            </View>
            
            <View style={{ marginBottom: 40 }} />
          </View>

          {/* Jagged Bottom Fix */}
          <View style={styles.jaggedBottomContainer}>
            {[...Array(40)].map((_, i) => (
              <View key={i} style={styles.tooth} />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { paddingTop: 50, paddingBottom: 60 },
  headerNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    marginBottom: 30
  },
  closeBtnContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeX: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    fontFamily: 'Inter', // Or any sans-serif available
  },
  navTitle: { color: '#fff', fontFamily: 'RubikBold', fontSize: 16, letterSpacing: 2 },
  receiptContainer: { paddingHorizontal: 30, width: '100%' },
  receiptPaper: {
    backgroundColor: '#E8E8E8', 
    width: '100%',
    paddingTop: 40,
    shadowColor: '#fff',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 10,
    overflow: 'hidden',
  },
  innerContent: { paddingHorizontal: 25, alignItems: 'center' },
  brandName: { fontFamily: 'RubikGlitch', fontSize: 32, color: '#000', marginBottom: 5 },
  merchantInfo: { fontFamily: 'Courier', fontSize: 10, color: '#444', textTransform: 'uppercase' },
  dottedDivider: {
    width: '100%',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    borderStyle: 'dashed',
    marginVertical: 20,
  },
  tableHeader: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 10 },
  tableHeaderText: { fontFamily: 'Courier', fontWeight: 'bold', fontSize: 12 },
  itemRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 8 },
  itemMain: { fontFamily: 'Courier', fontSize: 13, flex: 2 },
  itemQty: { fontFamily: 'Courier', fontSize: 13, flex: 1, textAlign: 'center' },
  itemBac: { fontFamily: 'Courier', fontSize: 13, flex: 1, textAlign: 'right' },
  totalBlock: { width: '100%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  totalLabel: { fontFamily: 'RubikBold', fontSize: 14 },
  totalValue: { fontFamily: 'Courier', fontSize: 16, fontWeight: 'bold' },
  barcodeArea: { marginTop: 30, alignItems: 'center', width: '100%' },
  barcodeMocks: { width: '100%', height: 40, backgroundColor: '#000', marginBottom: 5 },
  serialNumber: { fontFamily: 'Courier', fontSize: 10, letterSpacing: 3 },
  jaggedBottomContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  tooth: {
    width: 14,
    height: 14,
    backgroundColor: '#000',
    transform: [{ rotate: '45deg' }],
    marginTop: 3,
    marginHorizontal: -2,
  }
});