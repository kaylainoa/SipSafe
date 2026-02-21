import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function NightReceipt() {
  const router = useRouter();

  // Reusable component for the jagged edge
  // Define what the props look like
interface JaggedEdgeProps {
  position: 'top' | 'bottom';
}

const JaggedEdge = ({ position }: JaggedEdgeProps) => (
  <View style={[
    styles.jaggedContainer, 
    position === 'top' ? styles.topJagged : styles.bottomJagged
  ]}>
    {[...Array(40)].map((_, i) => (
      <View key={i} style={styles.tooth} />
    ))}
  </View>
);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtnContainer}>
          <Text style={styles.closeX}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>SUMMARY</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.receiptContainer}>
        <View style={styles.receiptPaper}>
          {/* Top Jagged Edge */}
          <JaggedEdge position="top" />

          <View style={styles.innerContent}>
            <Text style={styles.brandName}>SIPSAFE</Text>
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

          {/* Bottom Jagged Edge */}
          <JaggedEdge position="bottom" />
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
  closeBtnContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  closeX: { color: '#fff', fontSize: 28, fontWeight: '300' },
  navTitle: { color: '#fff', fontFamily: 'RubikBold', fontSize: 16, letterSpacing: 2 },
  receiptContainer: { paddingHorizontal: 30, width: '100%' },
  
  receiptPaper: {
    backgroundColor: '#D2C9B1', // Dusty/Aged paper color
    width: '100%',
    shadowColor: '#fff',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 10,
    overflow: 'hidden', // Clips the "teeth" so they only show outside the paper
  },
  
  innerContent: { paddingHorizontal: 25, alignItems: 'center', paddingTop: 20 },
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

  // Jagged logic
  jaggedContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 12,
    justifyContent: 'center',
    zIndex: 1,
  },
  topJagged: {
    marginTop: -7, // Pulls the teeth up to "cut" into the top
  },
  bottomJagged: {
    marginBottom: -7, // Pulls the teeth down to "cut" into the bottom
  },
  tooth: {
    width: 12,
    height: 12,
    backgroundColor: '#000', // Matches app background to create the "cut" effect
    transform: [{ rotate: '45deg' }],
    marginHorizontal: -1,
  }
});