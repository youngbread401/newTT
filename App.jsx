import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Pressable,
  TextInput, 
  ScrollView, 
  Alert, 
  Modal,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  Vibration,
  Dimensions
} from 'react-native';
import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  get, 
  off 
} from 'firebase/database';
import { debounce } from 'lodash';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { DiceRoller } from './components/DiceModel';
import ColorPicker from 'react-native-wheel-color-picker';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBSy8ia6vKnq95_gbO7lnohVbyAQzqBtk4",
  authDomain: "dndcombattracker-572b0.firebaseapp.com",
  databaseURL: "https://dndcombattracker-572b0-default-rtdb.firebaseio.com",
  projectId: "dndcombattracker-572b0",
  storageBucket: "dndcombattracker-572b0.firebasestorage.app",
  messagingSenderId: "812186225431",
  appId: "1:812186225431:web:8da48e238d10db01d14552"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Constants
const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const COLORS = [
  '#4527A0',  // Rich purple
  '#4A90E2',  // Bright blue
  '#7C4DFF',  // Bright purple
  '#00BFA5',  // Teal
  '#3F51B5',  // Indigo
  '#673AB7',  // Deep Purple
  '#2196F3',  // Blue
  '#B39DDB',  // Light Purple
  '#FF5252',  // Red
  '#FF4081',  // Pink
  '#E91E63',  // Deep Pink
  '#9C27B0',  // Purple
  '#009688',  // Green
  '#4CAF50',  // Light Green
  '#8BC34A',  // Lime
  '#CDDC39',  // Yellow-Green
  '#FFC107',  // Amber
  '#FF9800',  // Orange
  '#FF5722',  // Deep Orange
  '#795548',  // Brown
  '#607D8B',  // Blue Grey
  '#F44336',  // Bright Red
  '#E53935',  // Dark Red
  '#D32F2F',  // Darker Red
  '#C2185B',  // Dark Pink
  '#7B1FA2',  // Dark Purple
  '#512DA8',  // Dark Indigo
  '#303F9F',  // Dark Blue
  '#1976D2',  // Medium Blue
  '#0288D1',  // Light Blue
  '#0097A7',  // Cyan
  '#00796B',  // Dark Teal
  '#388E3C',  // Dark Green
  '#689F38',  // Olive Green
  '#AFB42B',  // Dark Lime
  '#FBC02D',  // Golden
  '#FFA000',  // Dark Amber
  '#F57C00',  // Dark Orange
  '#E64A19',  // Burnt Orange
  '#5D4037'   // Dark Brown
];
const GRID_SIZE = 10;
const ABILITY_SCORES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const SKILLS = {
  STR: ['Athletics'],
  DEX: ['Acrobatics', 'Sleight of Hand', 'Stealth'],
  CON: [],
  INT: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'],
  WIS: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'],
  CHA: ['Deception', 'Intimidation', 'Performance', 'Persuasion']
};
const CURRENCY = ['CP', 'SP', 'EP', 'GP', 'PP'];
const DICE_TYPES = [
  { sides: 4, color: '#FF6B6B' },
  { sides: 6, color: '#4ECDC4' },
  { sides: 8, color: '#45B7D1' },
  { sides: 10, color: '#96CEB4' },
  { sides: 12, color: '#FFEEAD' },
  { sides: 20, color: '#D4A5A5' },
  { sides: 100, color: '#9B59B6' }
];
const STATUS_EFFECTS = [
  { id: 'blinded', name: 'Blinded', icon: '👁️' },
  { id: 'charmed', name: 'Charmed', icon: '💕' },
  { id: 'deafened', name: 'Deafened', icon: '👂' },
  { id: 'frightened', name: 'Frightened', icon: '😨' },
  { id: 'grappled', name: 'Grappled', icon: '🤼' },
  { id: 'incapacitated', name: 'Incapacitated', icon: '💫' },
  { id: 'invisible', name: 'Invisible', icon: '👻' },
  { id: 'paralyzed', name: 'Paralyzed', icon: '⚡' },
  { id: 'petrified', name: 'Petrified', icon: '🗿' },
  { id: 'poisoned', name: 'Poisoned', icon: '🤢' },
  { id: 'prone', name: 'Prone', icon: '⬇️' },
  { id: 'restrained', name: 'Restrained', icon: '⛓️' },
  { id: 'stunned', name: 'Stunned', icon: '💫' },
  { id: 'unconscious', name: 'Unconscious', icon: '💤' }
];

// Add this constant near the other constants at the top
const COMMON_ENEMIES = [
  // CR 0-1
  {
    name: "Bandit",
    hp: 11,
    maxHp: 11,
    ac: 12,
    initiativeBonus: 1,
    color: '#8B4513'
  },
  {
    name: "Wolf",
    hp: 11,
    maxHp: 11,
    ac: 13,
    initiativeBonus: 2,
    color: '#808080'
  },
  {
    name: "Goblin",
    hp: 7,
    maxHp: 7,
    ac: 15,
    initiativeBonus: 2,
    color: '#355E3B'
  },
  {
    name: "Skeleton",
    hp: 13,
    maxHp: 13,
    ac: 13,
    initiativeBonus: 2,
    color: '#E1D9D1'
  },
  {
    name: "Zombie",
    hp: 22,
    maxHp: 22,
    ac: 8,
    initiativeBonus: -2,
    color: '#4A412A'
  },
  // CR 2-3
  {
    name: "Ogre",
    hp: 59,
    maxHp: 59,
    ac: 11,
    initiativeBonus: -1,
    color: '#8B8970'
  },
  {
    name: "Werewolf",
    hp: 58,
    maxHp: 58,
    ac: 12,
    initiativeBonus: 1,
    color: '#504A4B'
  },
  {
    name: "Phase Spider",
    hp: 32,
    maxHp: 32,
    ac: 13,
    initiativeBonus: 2,
    color: '#7851A9'
  },
  // CR 4-5
  {
    name: "Wraith",
    hp: 67,
    maxHp: 67,
    ac: 13,
    initiativeBonus: 2,
    color: '#4A0404'
  },
  {
    name: "Troll",
    hp: 84,
    maxHp: 84,
    ac: 15,
    initiativeBonus: 1,
    color: '#1B4D3E'
  },
  {
    name: "Hill Giant",
    hp: 105,
    maxHp: 105,
    ac: 13,
    initiativeBonus: -1,
    color: '#8B7355'
  },
  // CR 6-8
  {
    name: "Young White Dragon",
    hp: 133,
    maxHp: 133,
    ac: 17,
    initiativeBonus: 0,
    color: '#E8E4E1'
  },
  {
    name: "Hydra",
    hp: 172,
    maxHp: 172,
    ac: 15,
    initiativeBonus: 1,
    color: '#006400'
  },
  {
    name: "Frost Giant",
    hp: 138,
    maxHp: 138,
    ac: 15,
    initiativeBonus: -1,
    color: '#87CEEB'
  },
  // CR 9-12
  {
    name: "Fire Giant",
    hp: 162,
    maxHp: 162,
    ac: 18,
    initiativeBonus: -1,
    color: '#8B0000'
  },
  {
    name: "Young Red Dragon",
    hp: 178,
    maxHp: 178,
    ac: 18,
    initiativeBonus: 0,
    color: '#FF0000'
  },
  {
    name: "Archmage",
    hp: 99,
    maxHp: 99,
    ac: 12,
    initiativeBonus: 2,
    color: '#4B0082'
  },
  // CR 13+
  {
    name: "Adult Blue Dragon",
    hp: 225,
    maxHp: 225,
    ac: 19,
    initiativeBonus: 0,
    color: '#0000FF'
  },
  {
    name: "Ancient Green Dragon",
    hp: 385,
    maxHp: 385,
    ac: 21,
    initiativeBonus: 1,
    color: '#006400'
  },
  {
    name: "Lich",
    hp: 135,
    maxHp: 135,
    ac: 17,
    initiativeBonus: 3,
    color: '#800080'
  }
];

// Get window dimensions
const windowDimensions = Dimensions.get('window');
const isSmallScreen = windowDimensions.width < 768;

// Theme configuration
const THEME = {
  primary: '#2E1F5E',      // Deep purple
  secondary: '#4527A0',    // Rich purple
  accent: '#4A90E2',       // Bright blue
  gold: '#7C4DFF',         // Bright purple
  danger: '#FF5252',       // Red (keeping for clear danger indication)
  success: '#00BFA5',      // Teal (keeping for clear success indication)
  text: {
    light: '#FFFFFF',
    dark: '#1E1E1E'
  },
  background: {
    primary: '#1A103C',    // Darkest purple
    secondary: '#2E1F5E',  // Deep purple
    dark: '#150D30',       // Very dark purple
    panel: '#3F2B85'       // Medium purple
  }
};

// Initial game state
const initialGameState = {
  tokens: {},
  layers: {
    grid: true,
    terrain: {},
    tokens: {},
    effects: {},
    fog: {},
    aoe: {} // Add AoE layer
  },
  initiative: [],
  inCombat: false,
  currentTurn: 0,
  settings: {
    gridSize: GRID_SIZE,
    showCoordinates: true,
  },
  partyLoot: {
    currency: { CP: 0, SP: 0, EP: 0, GP: 0, PP: 0 },
    items: [],
    currentViewer: null
  },
  characters: [],
  campaignStory: {
    text: '',
    lastUpdate: null,
    updatedBy: null
  },
  pinnedNotes: [],
  lastUpdate: Date.now()
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background.primary,
    height: '100%',
    width: '100%',
  },
  header: {
    padding: isSmallScreen ? 10 : 20,
    backgroundColor: THEME.background.panel,
    width: '100%',
  },
  title: {
    fontSize: isSmallScreen ? 18 : 24,
    fontWeight: 'bold',
    color: THEME.text.light,
    marginBottom: 10,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: isSmallScreen ? 'center' : 'flex-start',
  },
  controlButton: {
    padding: isSmallScreen ? 8 : 10,
    borderRadius: 5,
    minWidth: isSmallScreen ? 80 : 100,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  mainArea: {
    flex: 1,
    flexDirection: isSmallScreen ? 'column' : 'row',
    padding: isSmallScreen ? 10 : 20,
    gap: 20,
    minHeight: '100%',
  },
  leftSidebar: {
    width: isSmallScreen ? '100%' : 350,
    flexShrink: 0,
    order: isSmallScreen ? 2 : 0,
  },
  gridSection: {
    flex: 1,
    minHeight: isSmallScreen ? 400 : '100%',
    order: isSmallScreen ? 1 : 1,
  },
  rightSidebar: {
    width: isSmallScreen ? '100%' : 350,
    flexShrink: 0,
    order: isSmallScreen ? 3 : 2,
  },
  gridContainer: {
    padding: isSmallScreen ? 5 : 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: isSmallScreen ? 35 : 60,
    height: isSmallScreen ? 35 : 60,
    borderWidth: 1,
    borderColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background.secondary,
  },
  tokenContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    padding: isSmallScreen ? 1 : 2,
  },
  tokenText: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tokenHp: {
    fontSize: isSmallScreen ? 8 : 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: THEME.background.panel,
    padding: 20,
    borderRadius: 10,
    width: isSmallScreen ? '90%' : 400,
  },
  modalTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: THEME.text.light,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.accent,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    color: THEME.text.light,
    backgroundColor: THEME.background.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: THEME.text.light,
    fontWeight: 'bold',
    fontSize: isSmallScreen ? 12 : 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background.primary,
    width: '100%',
    height: '100%',
  },
  loadingText: {
    color: THEME.text.light,
    fontSize: 16,
    marginTop: 10,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceBox: {
    width: '100%',
    backgroundColor: THEME.background.panel,
    borderRadius: 10,
    padding: isSmallScreen ? 8 : 15,
  },
  diceControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  diceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'center',
  },
  diceButton: {
    padding: isSmallScreen ? 5 : 10,
    backgroundColor: THEME.primary,
    borderRadius: 5,
    alignItems: 'center',
    minWidth: isSmallScreen ? 30 : 60,
  },
  diceHistory: {
    maxHeight: isSmallScreen ? 100 : 200,
    marginTop: 10,
  },
  diceResultContainer: {
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: THEME.accent + '40',
  },
  diceResult: {
    color: THEME.text.light,
  },
  diceTotal: {
    fontWeight: 'bold',
    color: THEME.accent,
  },
  diceRolls: {
    color: THEME.text.light + '80',
    fontSize: 12,
  },
  initiativeList: {
    backgroundColor: THEME.background.panel,
    borderRadius: 10,
    padding: isSmallScreen ? 8 : 15,
    width: '100%',
  },
  initiativeScroll: {
    maxHeight: isSmallScreen ? 150 : 200,
  },
  initiativeItem: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: THEME.background.primary,
  },
  currentInitiative: {
    backgroundColor: THEME.accent,
  },
  initiativeText: {
    color: THEME.text.light,
  },
  currentInitiativeText: {
    color: THEME.text.dark,
    fontWeight: 'bold',
  },
  zoomControls: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 10,
    display: isSmallScreen ? 'flex' : 'none',
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.background.panel,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  advantageButton: {
    backgroundColor: THEME.background.primary,
    padding: 8,
    borderRadius: 5,
  },
  advantageActive: {
    backgroundColor: THEME.accent,
  },
  modifierInput: {
    backgroundColor: THEME.background.primary,
    color: THEME.text.light,
    padding: 8,
    borderRadius: 5,
    width: 60,
    textAlign: 'center',
  },
  boxTitle: {
    color: THEME.text.light,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: isSmallScreen ? 2 : 5,
    marginBottom: isSmallScreen ? 5 : 10,
  },
  colorButton: {
    width: isSmallScreen ? 20 : 30,
    height: isSmallScreen ? 20 : 30,
    borderRadius: isSmallScreen ? 10 : 15,
    margin: isSmallScreen ? 1 : 2,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: THEME.accent,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 15,
    backgroundColor: THEME.background.panel,
    borderRadius: 10,
    marginBottom: 15,
  },
  quickActionButton: {
    backgroundColor: THEME.background.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    flex: 1,
  },
  quickActionText: {
    color: THEME.text.light,
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoPanel: {
    backgroundColor: THEME.background.panel,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoPanelTitle: {
    color: THEME.text.light,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoCard: {
    backgroundColor: THEME.background.secondary,
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: 150,
  },
  infoLabel: {
    color: THEME.accent,
    fontSize: 12,
    marginBottom: 5,
  },
  infoValue: {
    color: THEME.text.light,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statBadge: {
    backgroundColor: THEME.accent + '20',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statBadgeText: {
    color: THEME.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: THEME.accent + '40',
    marginVertical: 15,
  },
});

const additionalStyles = StyleSheet.create({
  characterSheet: {
    backgroundColor: THEME.background.panel,
    padding: 20,
    borderRadius: 10,
    width: isSmallScreen ? '95%' : '80%',
    maxWidth: 800,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.text.light,
    marginBottom: 10,
  },
  abilityScores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 10,
  },
  abilityBox: {
    backgroundColor: THEME.background.primary,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: isSmallScreen ? '30%' : 100,
    marginBottom: 10,
  },
  abilityLabel: {
    color: THEME.text.light,
    fontWeight: 'bold',
  },
  abilityScore: {
    color: THEME.accent,
    fontSize: 24,
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'center',
    padding: 5,
  },
  abilityMod: {
    color: THEME.text.light,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background.primary,
    padding: 8,
    borderRadius: 5,
    minWidth: isSmallScreen ? '45%' : 200,
  },
  proficientDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  skillName: {
    color: THEME.text.light,
    flex: 1,
  },
  skillMod: {
    color: THEME.accent,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  closeButtonText: {
    color: THEME.text.light,
    fontSize: 20,
  },
  lootSection: {
    backgroundColor: THEME.background.primary,
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencyInput: {
    backgroundColor: THEME.background.secondary,
    color: THEME.text.light,
    padding: 8,
    borderRadius: 5,
    width: 80,
    textAlign: 'center',
  },
  currencyLabel: {
    color: THEME.text.light,
    width: 30,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  itemInput: {
    flex: 1,
    backgroundColor: THEME.background.secondary,
    color: THEME.text.light,
    padding: 8,
    borderRadius: 5,
  },
  removeButton: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: THEME.danger,
  },
  addButton: {
    backgroundColor: THEME.success,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  lootHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  addedBy: {
    color: THEME.text.light,
    opacity: 0.6,
    fontSize: 12,
    marginTop: 4,
  },
  enemyOption: {
    padding: 15,
    borderRadius: 5,
    marginBottom: 8,
    backgroundColor: THEME.background.secondary,
  },
  dmToggle: {
    backgroundColor: THEME.background.secondary,
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  dmToggleActive: {
    backgroundColor: THEME.accent,
  }
});

const diceStyles = StyleSheet.create({
  dicePanel: {
    backgroundColor: THEME.background.panel,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  diceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  diceTitle: {
    color: THEME.text.light,
    fontSize: 18,
    fontWeight: 'bold',
  },
  diceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 15,
  },
  diceButton: {
    width: isSmallScreen ? 45 : 60,
    height: isSmallScreen ? 45 : 60,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)', // Replace elevation and shadowProps
  },
  diceButtonText: {
    color: THEME.text.light,
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: 'bold',
  },
  diceControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.background.primary,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    backgroundColor: THEME.background.secondary,
    padding: 8,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  controlActive: {
    backgroundColor: THEME.accent,
  },
  modifierGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modifierLabel: {
    color: THEME.text.light,
    fontSize: 14,
  },
  modifierInput: {
    backgroundColor: THEME.background.secondary,
    color: THEME.text.light,
    padding: 8,
    borderRadius: 5,
    width: 50,
    textAlign: 'center',
  },
  historyContainer: {
    backgroundColor: THEME.background.primary,
    borderRadius: 8,
    maxHeight: 200,
  },
  historyScroll: {
    padding: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.background.secondary,
  },
  historyLeft: {
    flex: 1,
  },
  historyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyDice: {
    color: THEME.text.light,
    opacity: 0.7,
  },
  historyRolls: {
    color: THEME.text.light,
    fontSize: 12,
    opacity: 0.5,
  },
  historyTotal: {
    color: THEME.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: THEME.background.secondary,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  quantityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  quantityLabel: {
    color: THEME.text.light,
    fontSize: 14,
  },
  quantityInput: {
    backgroundColor: THEME.background.secondary,
    color: THEME.text.light,
    padding: 8,
    borderRadius: 5,
    width: 50,
    textAlign: 'center',
  },
  diceControls: {
    flexDirection: 'column',
    backgroundColor: THEME.background.primary,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    gap: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diceContainer: {
    width: isSmallScreen ? 80 : 100,
    height: isSmallScreen ? 80 : 100,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 5,
  }
});

const statusStyles = StyleSheet.create({
  effectsContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: THEME.accent + '40',
    paddingTop: 15,
  },
  effectsTitle: {
    color: THEME.text.light,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  effectButton: {
    backgroundColor: THEME.background.primary,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    minWidth: 80,
  },
  effectActive: {
    backgroundColor: THEME.accent,
  },
  effectText: {
    color: THEME.text.light,
    fontSize: 12,
  },
  tokenEffects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 2,
  },
  effectIcon: {
    fontSize: isSmallScreen ? 10 : 12,
  },
});

// Create a helper function to save game state
const saveGameState = async () => {
  if (firebaseRef.current) {
    try {
      await set(firebaseRef.current, {
        tokens,
        layers,
        initiative,
        inCombat,
        currentTurn,
        partyLoot,
        characters,
        settings: initialGameState.settings,
        lastUpdate: Date.now()
      });
    } catch (error) {
      console.error('Error saving game state:', error);
      Alert.alert('Error', 'Failed to save game state');
    }
  }
};

// Add this component definition before the TokenModal component
const CharacterSheetModal = memo(({ visible, onClose, character, characters, onUpdate }) => {
  const [editedCharacter, setEditedCharacter] = useState(() => ({
    name: character?.name || '',
    class: character?.class || '',
    level: character?.level || 1,
    owner: character?.owner || '',
    proficiencyBonus: character?.proficiencyBonus || 2,
    // Add HP and AC
    hp: character?.hp || 0,
    maxHp: character?.maxHp || 0,
    ac: character?.ac || 10,
    abilityScores: character?.abilityScores || {
      STR: 10,
      DEX: 10,
      CON: 10,
      INT: 10,
      WIS: 10,
      CHA: 10
    },
    proficientSkills: character?.proficientSkills || [],
    currency: character?.currency || {
      CP: 0,
      SP: 0,
      EP: 0,
      GP: 0,
      PP: 0
    },
    items: character?.items || [],
    inventory: character?.inventory || []
  }));

  useEffect(() => {
    if (visible && character) {
      setEditedCharacter({
        name: character.name || '',
        class: character.class || '',
        level: character.level || 1,
        owner: character.owner || '',
        proficiencyBonus: character.proficiencyBonus || 2,
        hp: character.hp || 0,
        maxHp: character.maxHp || 0,
        ac: character.ac || 10,
        abilityScores: character.abilityScores || {
          STR: 10,
          DEX: 10,
          CON: 10,
          INT: 10,
          WIS: 10,
          CHA: 10
        },
        proficientSkills: character.proficientSkills || [],
        currency: character.currency || {
          CP: 0,
          SP: 0,
          EP: 0,
          GP: 0,
          PP: 0
        },
        items: character.items || [],
        inventory: character.inventory || []
      });
    }
  }, [visible, character]);

  // Add error boundary
  if (!character) {
    console.error('No character data provided to CharacterSheetModal');
    return null;
  }

  const calculateModifier = (score) => {
    return Math.floor((score - 10) / 2);
  };

  const handleAbilityScoreChange = (ability, value) => {
    const newScore = parseInt(value) || 0;
    setEditedCharacter(prev => ({
      ...prev,
      abilityScores: {
        ...prev.abilityScores,
        [ability]: newScore
      }
    }));
  };

  const toggleProficiency = (skill) => {
    setEditedCharacter(prev => ({
      ...prev,
      proficientSkills: prev.proficientSkills.includes(skill)
        ? prev.proficientSkills.filter(s => s !== skill)
        : [...prev.proficientSkills, skill]
    }));
  };

  const getSkillModifier = (skill, ability) => {
    const abilityMod = calculateModifier(editedCharacter.abilityScores[ability]);
    const profBonus = editedCharacter.proficientSkills.includes(skill) ? editedCharacter.proficiencyBonus : 0;
    return abilityMod + profBonus;
  };

  const handleSave = async () => {
    try {
      const updatedCharacter = {
        ...character,
        ...editedCharacter
      };

      onUpdate(updatedCharacter);
    } catch (error) {
      console.error('Error saving character:', error);
      Alert.alert('Error', 'Failed to save character');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={additionalStyles.characterSheet}>
          <TouchableOpacity 
            style={additionalStyles.closeButton}
            onPress={onClose}
          >
            <Text style={additionalStyles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <GestureScrollView>
            {/* Basic Info */}
            <View style={additionalStyles.sheetSection}>
              <Text style={additionalStyles.sectionTitle}>Character Info</Text>
              <TextInput
                style={styles.input}
                value={editedCharacter.name}
                onChangeText={(text) => setEditedCharacter(prev => ({...prev, name: text}))}
                placeholder="Character Name"
                placeholderTextColor={THEME.text.light + '80'}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={editedCharacter.class}
                  onChangeText={(text) => setEditedCharacter(prev => ({...prev, class: text}))}
                  placeholder="Class"
                  placeholderTextColor={THEME.text.light + '80'}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={String(editedCharacter.level)}
                  onChangeText={(text) => setEditedCharacter(prev => ({...prev, level: parseInt(text) || 1}))}
                  placeholder="Level"
                  keyboardType="numeric"
                  placeholderTextColor={THEME.text.light + '80'}
                />
              </View>

              {/* Add HP and AC fields here */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.buttonText, { marginBottom: 5 }]}>Hit Points</Text>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={String(editedCharacter.hp)}
                      onChangeText={(text) => setEditedCharacter(prev => ({
                        ...prev,
                        hp: parseInt(text) || 0
                      }))}
                      placeholder="Current HP"
                      keyboardType="numeric"
                      placeholderTextColor={THEME.text.light + '80'}
                    />
                    <Text style={{ color: THEME.text.light, alignSelf: 'center', fontSize: 18 }}>/</Text>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={String(editedCharacter.maxHp)}
                      onChangeText={(text) => setEditedCharacter(prev => ({
                        ...prev,
                        maxHp: parseInt(text) || 0
                      }))}
                      placeholder="Max HP"
                      keyboardType="numeric"
                      placeholderTextColor={THEME.text.light + '80'}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.buttonText, { marginBottom: 5 }]}>Armor Class</Text>
                  <TextInput
                    style={styles.input}
                    value={String(editedCharacter.ac)}
                    onChangeText={(text) => setEditedCharacter(prev => ({
                      ...prev,
                      ac: parseInt(text) || 10
                    }))}
                    placeholder="AC"
                    keyboardType="numeric"
                    placeholderTextColor={THEME.text.light + '80'}
                  />
                </View>
              </View>
            </View>

            {/* Ability Scores */}
            <View style={additionalStyles.sheetSection}>
              <Text style={additionalStyles.sectionTitle}>Ability Scores</Text>
              <View style={additionalStyles.abilityScores}>
                {ABILITY_SCORES.map(ability => (
                  <View key={ability} style={additionalStyles.abilityBox}>
                    <Text style={additionalStyles.abilityLabel}>{ability}</Text>
                    <TextInput
                      style={additionalStyles.abilityScore}
                      value={String(editedCharacter.abilityScores[ability])}
                      onChangeText={(text) => handleAbilityScoreChange(ability, text)}
                      keyboardType="numeric"
                      maxLength={2}
                      selectTextOnFocus={true}
                    />
                    <Text style={additionalStyles.abilityMod}>
                      {calculateModifier(editedCharacter.abilityScores[ability]) >= 0 ? '+' : ''}
                      {calculateModifier(editedCharacter.abilityScores[ability])}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Skills */}
            <View style={additionalStyles.sheetSection}>
              <Text style={additionalStyles.sectionTitle}>Skills</Text>
              <View style={additionalStyles.skillsList}>
                {Object.entries(SKILLS).map(([ability, skills]) =>
                  skills.map(skill => (
                    <TouchableOpacity
                      key={skill}
                      style={additionalStyles.skillItem}
                      onPress={() => toggleProficiency(skill)}
                    >
                      <View style={[
                        additionalStyles.proficientDot,
                        {
                          backgroundColor: editedCharacter.proficientSkills.includes(skill)
                            ? THEME.accent
                            : THEME.background.secondary
                        }
                      ]} />
                      <Text style={additionalStyles.skillName}>{skill}</Text>
                      <Text style={additionalStyles.skillMod}>
                        {getSkillModifier(skill, ability) >= 0 ? '+' : ''}
                        {getSkillModifier(skill, ability)}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>

            {/* Inventory */}
            <View style={additionalStyles.sheetSection}>
              <Text style={additionalStyles.sectionTitle}>Inventory</Text>

              <View style={additionalStyles.lootSection}>
                {/* Currency */}
                {CURRENCY.map(currency => (
                  <View key={currency} style={additionalStyles.currencyRow}>
                    <Text style={additionalStyles.currencyLabel}>{currency}</Text>
                    <TextInput
                      style={additionalStyles.currencyInput}
                      value={String(editedCharacter.currency[currency] || 0)}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 0;
                        setEditedCharacter(prev => ({
                          ...prev,
                          currency: {
                            ...prev.currency,
                            [currency]: value
                          }
                        }));
                      }}
                      keyboardType="numeric"
                      placeholderTextColor={THEME.text.light + '80'}
                    />
                  </View>
                ))}
              </View>

              <View style={additionalStyles.lootSection}>
                <View style={additionalStyles.lootHeader}>
                  <Text style={additionalStyles.sectionTitle}>Items</Text>
                  <TouchableOpacity
                    style={additionalStyles.addButton}
                    onPress={() => {
                      setEditedCharacter(prev => ({
                        ...prev,
                        items: [...prev.items, { name: '', quantity: 1, notes: '', addedBy: character.name }]
                      }));
                    }}
                  >
                    <Text style={styles.buttonText}>Add Item</Text>
                  </TouchableOpacity>
                </View>

                {editedCharacter.items.map((item, index) => (
                  <View key={index} style={additionalStyles.itemRow}>
                    <View style={additionalStyles.itemInfo}>
                      <TextInput
                        style={[additionalStyles.itemInput, { flex: 2 }]}
                        value={item.name}
                        onChangeText={(text) => {
                          const newItems = [...editedCharacter.items];
                          newItems[index] = { ...item, name: text };
                          setEditedCharacter(prev => ({ ...prev, items: newItems }));
                        }}
                        placeholder="Item name"
                        placeholderTextColor={THEME.text.light + '80'}
                      />
                      <TextInput
                        style={[additionalStyles.itemInput, { width: 60 }]}
                        value={String(item.quantity)}
                        onChangeText={(text) => {
                          const newItems = [...editedCharacter.items];
                          newItems[index] = { ...item, quantity: parseInt(text) || 1 };
                          setEditedCharacter(prev => ({ ...prev, items: newItems }));
                        }}
                        keyboardType="numeric"
                        placeholder="Qty"
                        placeholderTextColor={THEME.text.light + '80'}
                      />
                      {item.addedBy === character.name && (
                        <TouchableOpacity
                          style={additionalStyles.removeButton}
                          onPress={() => {
                            setEditedCharacter(prev => ({
                              ...prev,
                              items: prev.items.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <Text style={styles.buttonText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={additionalStyles.addedBy}>Added by: {item.addedBy}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: THEME.success }]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </GestureScrollView>
        </View>
      </View>
    </Modal>
  );
});

// Memoized Modal Components
const TokenModal = memo(({ 
  showTokenModal, 
  setShowTokenModal, 
  selectedToken, 
  setSelectedToken, 
  tokens, 
  firebaseRef, 
  initialGameState, 
  layers, 
  initiative, 
  inCombat, 
  currentTurn, 
  THEME 
}) => (
  <Modal
    visible={showTokenModal}
    transparent={true}
    animationType="fade"
    onRequestClose={() => setShowTokenModal(false)}
  >
    <Pressable 
      style={[styles.modalOverlay, { cursor: 'default' }]}
      onPress={() => Keyboard.dismiss()}
    >
      <View style={styles.modalContent}>
        <KeyboardAvoidingView 
          behavior={Platform.select({ ios: 'padding', android: 'height' })}
          style={styles.modalContainer}
          keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
        >
          <Pressable onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit Token</Text>
            <TextInput
              style={styles.input}
              value={selectedToken?.name}
              onChangeText={(text) => {
                setSelectedToken(prev => ({
                  ...prev,
                  name: text
                }));
              }}
              placeholder="Token Name"
              placeholderTextColor={THEME.text.light + '80'}
              blurOnSubmit={false}
              autoComplete="off"
              spellCheck={false}
              selectTextOnFocus={true}
              enablesReturnKeyAutomatically={true}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={String(selectedToken?.hp || '')}
                  onChangeText={(text) => {
                    const hp = parseInt(text) || 0;
                    setSelectedToken(prev => ({
                      ...prev,
                      hp: Math.max(0, hp)
                    }));
                  }}
                  keyboardType="numeric"
                  placeholder="Current HP"
                  placeholderTextColor={THEME.text.light + '80'}
                  blurOnSubmit={false}
                  autoComplete="off"
                  selectTextOnFocus={true}
                  enablesReturnKeyAutomatically={true}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={String(selectedToken?.maxHp || '')}
                  onChangeText={(text) => {
                    const maxHp = parseInt(text) || 1;
                    setSelectedToken(prev => ({
                      ...prev,
                      maxHp: Math.max(1, maxHp)
                    }));
                  }}
                  keyboardType="numeric"
                  placeholder="Max HP"
                  placeholderTextColor={THEME.text.light + '80'}
                  blurOnSubmit={false}
                  autoComplete="off"
                  selectTextOnFocus={true}
                  enablesReturnKeyAutomatically={true}
                />
              </View>
            </View>

            <TextInput
              style={styles.input}
              value={String(selectedToken?.initiativeBonus || '0')}
              onChangeText={(text) => {
                setSelectedToken(prev => ({
                  ...prev,
                  initiativeBonus: parseInt(text) || 0
                }));
              }}
              keyboardType="numeric"
              placeholder="Initiative Bonus"
              placeholderTextColor={THEME.text.light + '80'}
              blurOnSubmit={false}
              autoComplete="off"
              selectTextOnFocus={true}
              enablesReturnKeyAutomatically={true}
            />

            <View style={statusStyles.effectsContainer}>
              <Text style={statusStyles.effectsTitle}>Status Effects</Text>
              <View style={statusStyles.effectsGrid}>
                {STATUS_EFFECTS.map(effect => (
                  <TouchableOpacity
                    key={effect.id}
                    style={[
                      statusStyles.effectButton,
                      selectedToken?.effects?.includes(effect.id) && statusStyles.effectActive
                    ]}
                    onPress={() => {
                      setSelectedToken(prev => {
                        const currentEffects = prev.effects || [];
                        const newEffects = currentEffects.includes(effect.id)
                          ? currentEffects.filter(e => e !== effect.id)
                          : [...currentEffects, effect.id];
                        return {
                          ...prev,
                          effects: newEffects
                        };
                      });
                    }}
                  >
                    <Text style={statusStyles.effectText}>
                      {effect.icon} {effect.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: THEME.danger }]}
                onPress={() => {
                  if (firebaseRef.current && selectedToken) {
                    // First get current room data
                    get(firebaseRef.current).then((snapshot) => {
                      const currentRoomData = snapshot.val() || {};
                      const newTokens = { ...tokens };
                      delete newTokens[selectedToken.position];
                      
                      // Update while preserving existing data
                      set(firebaseRef.current, { 
                        ...currentRoomData,
                        tokens: newTokens,
                        lastUpdate: Date.now()
                      });
                      setShowTokenModal(false);
                    });
                  }
                }}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: THEME.success }]}
                onPress={() => {
                  if (firebaseRef.current && selectedToken) {
                    // First get current room data
                    get(firebaseRef.current).then((snapshot) => {
                      const currentRoomData = snapshot.val() || {};
                      const newTokens = {
                        ...tokens,
                        [selectedToken.position]: selectedToken
                      };
                      
                      // Update while preserving existing data
                      set(firebaseRef.current, {
                        ...currentRoomData,
                        tokens: newTokens,
                        lastUpdate: Date.now()
                      });
                      setShowTokenModal(false);
                    });
                  }
                }}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </Pressable>
  </Modal>
));

// Update the RoomModal styles
const modalStyles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Add high z-index
  },
  modalContent: {
    backgroundColor: THEME.background.panel,
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
    zIndex: 1001, // Even higher z-index
  },
});

// Update the RoomModal component
const RoomModal = memo(({ 
  showRoomModal, 
  setShowRoomModal, 
  isConnected, 
  roomCode, 
  setRoomCode, 
  isJoining, 
  connectToRoom 
}) => {
  if (!showRoomModal) return null;
  
  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={[modalStyles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
        <View style={modalStyles.modalContent}>
          <Text style={styles.modalTitle}>Join Room</Text>
          <TextInput
            style={[styles.input, { marginBottom: 15 }]}
            value={roomCode}
            onChangeText={(text) => {
              setRoomCode(text.trim().toLowerCase());
            }}
            placeholder="Enter room code..."
            placeholderTextColor={THEME.text.light + '80'}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isJoining}
            autoFocus={true}
          />
          <TouchableOpacity
            style={[
              styles.modalButton,
              { 
                backgroundColor: isJoining ? THEME.background.secondary : THEME.success,
                width: '100%'
              }
            ]}
            onPress={() => {
              Keyboard.dismiss();
              connectToRoom(roomCode);
            }}
            disabled={isJoining}
          >
            {isJoining ? (
              <View style={styles.loadingButtonContent}>
                <ActivityIndicator color={THEME.text.light} />
                <Text style={[styles.buttonText, { marginLeft: 10 }]}>
                  Connecting...
                </Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Join Room</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const PartyLootModal = memo(({ visible, onClose, partyLoot, onUpdate, playerName }) => {
  const [editedLoot, setEditedLoot] = useState({
    currency: {
      CP: 0,
      SP: 0,
      EP: 0,
      GP: 0,
      PP: 0
    },
    items: []
  });

  useEffect(() => {
    if (visible && partyLoot) {
      setEditedLoot({
        currency: partyLoot.currency || {
          CP: 0,
          SP: 0,
          EP: 0,
          GP: 0,
          PP: 0
        },
        items: partyLoot.items || []
      });
    }
  }, [visible, partyLoot]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '90%' }]}>
          <Text style={styles.modalTitle}>Party Loot</Text>

          <ScrollView>
            {/* Currency Section */}
            <View style={additionalStyles.lootSection}>
              {CURRENCY.map(type => (
                <View key={type} style={additionalStyles.currencyRow}>
                  <Text style={additionalStyles.currencyLabel}>{type}</Text>
                  <TextInput
                    style={additionalStyles.currencyInput}
                    value={String(editedLoot.currency[type] || 0)}
                    onChangeText={(text) => {
                      const value = parseInt(text) || 0;
                      setEditedLoot(prev => ({
                        ...prev,
                        currency: {
                          ...prev.currency,
                          [type]: value
                        }
                      }));
                    }}
                    keyboardType="numeric"
                    placeholderTextColor={THEME.text.light + '80'}
                  />
                </View>
              ))}
            </View>

            {/* Items Section */}
            <View style={additionalStyles.lootSection}>
              <View style={additionalStyles.lootHeader}>
                <Text style={additionalStyles.sectionTitle}>Items</Text>
                <TouchableOpacity
                  style={additionalStyles.addButton}
                  onPress={() => {
                    setEditedLoot(prev => ({
                      ...prev,
                      items: [...prev.items, { 
                        id: Date.now().toString(),
                        name: '',
                        quantity: 1,
                        addedBy: playerName 
                      }]
                    }));
                  }}
                >
                  <Text style={styles.buttonText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {editedLoot.items.map((item, index) => (
                <View key={item.id || index} style={additionalStyles.itemRow}>
                  <TextInput
                    style={[additionalStyles.itemInput, { flex: 2 }]}
                    value={item.name}
                    onChangeText={(text) => {
                      const newItems = [...editedLoot.items];
                      newItems[index] = { ...item, name: text };
                      setEditedLoot(prev => ({ ...prev, items: newItems }));
                    }}
                    placeholder="Item name"
                    placeholderTextColor={THEME.text.light + '80'}
                  />
                  <TextInput
                    style={[additionalStyles.itemInput, { width: 60 }]}
                    value={String(item.quantity)}
                    onChangeText={(text) => {
                      const newItems = [...editedLoot.items];
                      newItems[index] = { ...item, quantity: parseInt(text) || 1 };
                      setEditedLoot(prev => ({ ...prev, items: newItems }));
                    }}
                    keyboardType="numeric"
                    placeholder="Qty"
                    placeholderTextColor={THEME.text.light + '80'}
                  />
                  <TouchableOpacity
                    style={additionalStyles.removeButton}
                    onPress={() => {
                      setEditedLoot(prev => ({
                        ...prev,
                        items: prev.items.filter((_, i) => i !== index)
                      }));
                    }}
                  >
                    <Text style={styles.buttonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: THEME.success }]}
              onPress={() => {
                onUpdate(editedLoot);
                onClose();
              }}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

// Add this component definition before the App component
const GridZoomControls = memo(({ zoomLevel, setZoomLevel }) => {
  const debouncedZoom = debounce((newZoom) => {
    setZoomLevel(newZoom);
  }, 100);

  return (
    <View style={styles.zoomControls}>
      <TouchableOpacity
        style={styles.zoomButton}
        onPress={() => debouncedZoom(Math.max(0.5, zoomLevel - 0.1))}
      >
        <Text style={styles.buttonText}>-</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.zoomButton}
        onPress={() => debouncedZoom(Math.min(2, zoomLevel + 0.1))}
      >
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
});

// Add InventoryModal component
const InventoryModal = memo(({ visible, onClose, character, onUpdate }) => {
  const [editedInventory, setEditedInventory] = useState({
    currency: character?.currency || {
      CP: 0,
      SP: 0,
      EP: 0,
      GP: 0,
      PP: 0
    },
    inventory: character?.inventory || []
  });

  useEffect(() => {
    if (visible && character) {
      setEditedInventory({
        currency: character.currency || {
          CP: 0,
          SP: 0,
          EP: 0,
          GP: 0,
          PP: 0
        },
        inventory: character.inventory || []
      });
    }
  }, [visible, character]);

  if (!visible || !character) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={additionalStyles.characterSheet}>
          <TouchableOpacity 
            style={additionalStyles.closeButton}
            onPress={onClose}
          >
            <Text style={additionalStyles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <Text style={additionalStyles.sectionTitle}>{character.name}'s Inventory</Text>

          <GestureScrollView>
            <View style={additionalStyles.lootSection}>
              {/* Currency */}
              {CURRENCY.map(currency => (
                <View key={currency} style={additionalStyles.currencyRow}>
                  <Text style={additionalStyles.currencyLabel}>{currency}</Text>
                  <TextInput
                    style={additionalStyles.currencyInput}
                    value={String(editedInventory.currency[currency] || 0)}
                    onChangeText={(text) => {
                      const value = parseInt(text) || 0;
                      setEditedInventory(prev => ({
                        ...prev,
                        currency: {
                          ...prev.currency,
                          [currency]: value
                        }
                      }));
                    }}
                    keyboardType="numeric"
                    placeholderTextColor={THEME.text.light + '80'}
                  />
                </View>
              ))}
            </View>

            <View style={additionalStyles.lootSection}>
              <View style={additionalStyles.lootHeader}>
                <Text style={additionalStyles.sectionTitle}>Items</Text>
                <TouchableOpacity
                  style={additionalStyles.addButton}
                  onPress={() => {
                    setEditedInventory(prev => ({
                      ...prev,
                      inventory: [...prev.inventory, { name: '', quantity: 1, notes: '', addedBy: character.name }]
                    }));
                  }}
                >
                  <Text style={styles.buttonText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {editedInventory.inventory.map((item, index) => (
                <View key={index} style={additionalStyles.itemRow}>
                  <View style={additionalStyles.itemInfo}>
                    <TextInput
                      style={[additionalStyles.itemInput, { flex: 2 }]}
                      value={item.name}
                      onChangeText={(text) => {
                        const newInventory = [...editedInventory.inventory];
                        newInventory[index] = { ...item, name: text };
                        setEditedInventory(prev => ({ ...prev, inventory: newInventory }));
                      }}
                      placeholder="Item name"
                      placeholderTextColor={THEME.text.light + '80'}
                    />
                    <TextInput
                      style={[additionalStyles.itemInput, { width: 60 }]}
                      value={String(item.quantity)}
                      onChangeText={(text) => {
                        const newInventory = [...editedInventory.inventory];
                        newInventory[index] = { ...item, quantity: parseInt(text) || 1 };
                        setEditedInventory(prev => ({ ...prev, inventory: newInventory }));
                      }}
                      keyboardType="numeric"
                      placeholder="Qty"
                      placeholderTextColor={THEME.text.light + '80'}
                    />
                    {item.addedBy === character.name && (
                      <TouchableOpacity
                        style={additionalStyles.removeButton}
                        onPress={() => {
                          setEditedInventory(prev => ({
                            ...prev,
                            inventory: prev.inventory.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        <Text style={styles.buttonText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={additionalStyles.addedBy}>Added by: {item.addedBy}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: THEME.success }]}
              onPress={() => {
                onUpdate({
                  ...character,
                  currency: editedInventory.currency,
                  inventory: editedInventory.inventory
                });
                onClose();
              }}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          </GestureScrollView>
        </View>
      </View>
    </Modal>
  );
});

// Add PlayerNameModal component
const PlayerNameModal = memo(({ visible, onSubmit }) => {
  const [name, setName] = useState('');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enter Your Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={THEME.text.light + '80'}
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[styles.modalButton, { 
              backgroundColor: THEME.success,
              width: '100%',
              marginTop: 10
            }]}
            onPress={() => onSubmit(name)}
            disabled={!name.trim()}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

// Add to styles
const viewerStyles = StyleSheet.create({
  viewersList: {
    marginTop: 15,
    padding: 10,
    backgroundColor: THEME.background.primary,
    borderRadius: 5,
  },
  viewersTitle: {
    color: THEME.text.light,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  viewerName: {
    color: THEME.text.light,
    opacity: 0.8,
    fontSize: 12,
    marginBottom: 2,
  },
});

// Add this function at the top level of the App component, before the state declarations
const calculateModifier = (score) => {
  return Math.floor((score - 10) / 2);
};

// Add this new component near the other modal components
const DiceResultModal = memo(({ visible, result, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible || !result) return null;

  return (
    <View style={{
      position: 'fixed', // Change from 'absolute' to 'fixed'
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999, // Increase zIndex to ensure it's above everything
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Add semi-transparent background
    }}>
      <View style={{
        backgroundColor: THEME.background.panel + 'E6',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        minWidth: 200,
        maxWidth: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
        <Text style={{
          color: THEME.text.light,
          fontSize: 18,
          marginBottom: 5,
        }}>
          {result.dice} {result.rollType !== 'normal' ? `(${result.rollType})` : ''}
        </Text>
        <Text style={{
          color: THEME.accent,
          fontSize: 32,
          fontWeight: 'bold',
          marginBottom: 5,
        }}>
          {result.total}
        </Text>
        <Text style={{
          color: THEME.text.light + '80',
          fontSize: 14,
        }}>
          Rolls: [{result.rolls.join(', ')}]
          {result.modifier !== 0 && ` + ${result.modifier}`}
        </Text>
      </View>
    </View>
  );
});

// Add this new component near the other modal components
const DeleteCharacterModal = memo(({ visible, character, onClose, onConfirm }) => {
  const [confirmName, setConfirmName] = useState('');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Delete Character</Text>
          <Text style={[styles.buttonText, { marginBottom: 10, textAlign: 'center' }]}>
            Type "{character?.name}" to confirm deletion
          </Text>
          <TextInput
            style={styles.input}
            value={confirmName}
            onChangeText={setConfirmName}
            placeholder="Character name"
            placeholderTextColor={THEME.text.light + '80'}
          />
          <View style={[styles.modalButtons, { marginTop: 15 }]}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: THEME.background.secondary }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton, 
                { 
                  backgroundColor: confirmName === character?.name ? THEME.danger : THEME.background.secondary,
                  opacity: confirmName === character?.name ? 1 : 0.5
                }
              ]}
              onPress={() => {
                if (confirmName === character?.name) {
                  onConfirm();
                }
              }}
              disabled={confirmName !== character?.name}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

// Add this new component for the enemy selection modal
const EnemySelectModal = memo(({ visible, onClose, onSelect }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Enemy</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            {COMMON_ENEMIES.map((enemy, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.enemyOption,
                  { backgroundColor: THEME.background.secondary }
                ]}
                onPress={() => onSelect(enemy)}
              >
                <Text style={styles.buttonText}>{enemy.name}</Text>
                <Text style={[styles.buttonText, { opacity: 0.7, fontSize: 12 }]}>
                  HP: {enemy.hp} • AC: {enemy.ac}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: THEME.background.secondary, marginTop: 10 }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

// Add new ColorWheel component before the App component
const ColorWheelModal = memo(({ visible, onClose, onSelectColor, initialColor }) => {
  const [color, setColor] = useState(initialColor || '#FF0000');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: isSmallScreen ? '90%' : 400, padding: 20 }]}>
          <Text style={styles.modalTitle}>Select Color</Text>
          <View style={{ height: 300, marginVertical: 20 }}>
            <ColorPicker
              color={color}
              onColorChange={setColor}
              thumbSize={30}
              sliderSize={30}
              noSnap={true}
              row={false}
            />
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: THEME.background.secondary }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: THEME.success }]}
              onPress={() => {
                onSelectColor(color);
                onClose();
              }}
            >
              <Text style={styles.buttonText}>Select</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

// Add this new component near the other modal components
const PinnedNotesModal = memo(({ visible, onClose, notes, onAddNote, onDeleteNote, newNote, setNewNote }) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: '90%', maxWidth: 500 }]}>
          <Text style={styles.modalTitle}>Pinned Notes</Text>
          <TextInput
            style={[styles.input, { marginBottom: 10 }]}
            value={newNote}
            onChangeText={setNewNote}
            placeholder="Add a new note..."
            placeholderTextColor={THEME.text.light + '80'}
            multiline
          />
          <TouchableOpacity 
            style={[styles.modalButton, { backgroundColor: THEME.success, marginBottom: 15 }]}
            onPress={onAddNote}
          >
            <Text style={styles.buttonText}>Add Note</Text>
          </TouchableOpacity>
          <ScrollView style={{ maxHeight: 300 }}>
            {notes.map(note => (
              <View key={note.id} style={[styles.infoCard, { marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={[styles.buttonText, { flex: 1 }]}>{note.text}</Text>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: THEME.danger, padding: 5, marginLeft: 10 }]}
                  onPress={() => onDeleteNote(note.id)}
                >
                  <Text style={styles.buttonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: THEME.background.secondary, marginTop: 15 }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

// Add this new component near the other modal components
const RulesModal = memo(({ visible, onClose }) => {
  if (!visible) return null;

  const rules = [
    {
      title: "Ability Checks",
      content: "Roll d20 + ability modifier + proficiency bonus (if proficient). Compare total against DC (Difficulty Class)."
    },
    {
      title: "Attack Rolls",
      content: "Roll d20 + ability modifier + proficiency bonus. Compare against target's AC (Armor Class)."
    },
    {
      title: "Saving Throws",
      content: "Roll d20 + ability modifier + proficiency bonus (if proficient). Compare against DC of effect."
    },
    {
      title: "Advantage/Disadvantage",
      content: "Roll 2d20. With advantage, take higher roll. With disadvantage, take lower roll."
    },
    {
      title: "Combat Actions",
      content: "On your turn: Move up to your speed, take one action (Attack, Cast Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Use Object), and one bonus action if available."
    },
    {
      title: "Reactions",
      content: "One reaction per round. Used for opportunity attacks, certain spells, and special abilities. Resets at start of your turn."
    },
    {
      title: "Death Saves",
      content: "When at 0 HP, roll d20. 10+ is success, 9- is failure. 3 successes: become stable. 3 failures: die. Natural 20: regain 1 HP. Natural 1: counts as 2 failures."
    },
    {
      title: "Conditions",
      content: "Common conditions: Blinded, Charmed, Deafened, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious."
    },
    {
      title: "Resting",
      content: "Short Rest (1+ hour): Use Hit Dice to heal. Long Rest (8 hours): Regain all HP, half total Hit Dice, all spell slots."
    },
    {
      title: "Cover",
      content: "Half cover: +2 AC and DEX saves. Three-quarters cover: +5 AC and DEX saves. Full cover: Can't be targeted directly."
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: '90%', maxWidth: 500, maxHeight: '90%' }]}>
          <Text style={styles.modalTitle}>D&D Basic Rules</Text>
          <ScrollView style={{ maxHeight: '90%' }}>
            {rules.map((rule, index) => (
              <View key={index} style={[styles.infoCard, { marginBottom: 10 }]}>
                <Text style={[styles.buttonText, { color: THEME.accent, marginBottom: 5, fontWeight: 'bold' }]}>
                  {rule.title}
                </Text>
                <Text style={[styles.buttonText, { fontSize: 14 }]}>
                  {rule.content}
                </Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: THEME.background.secondary, marginTop: 15 }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

export default function App() {
  // Add calculateModifier here
  const calculateModifier = (score) => {
    return Math.floor((score - 10) / 2);
  };

  // State declarations
  const [roomCode, setRoomCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(isSmallScreen ? 0.8 : 1);
  const [tokens, setTokens] = useState({});
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [initiative, setInitiative] = useState([]);
  const [inCombat, setInCombat] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [layers, setLayers] = useState(initialGameState.layers);
  const [diceHistory, setDiceHistory] = useState([]);
  const [advantage, setAdvantage] = useState(false);
  const [modifier, setModifier] = useState(0);
  const [selectedToken, setSelectedToken] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [partyLoot, setPartyLoot] = useState({
    currency: {
      CP: 0,
      SP: 0,
      EP: 0,
      GP: 0,
      PP: 0
    },
    items: [],
    currentViewer: null
  });
  const [showPartyLoot, setShowPartyLoot] = useState(false);
  const [diceQuantity, setDiceQuantity] = useState(1);
  const [characters, setCharacters] = useState([]);
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showPlayerNameModal, setShowPlayerNameModal] = useState(true);
  const [rollType, setRollType] = useState('normal');
  const [diceResult, setDiceResult] = useState(null);
  const [showDiceResult, setShowDiceResult] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDM, setIsDM] = useState(false);
  const [showEnemySelect, setShowEnemySelect] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [storyText, setStoryText] = useState('');
  const [isAoeMode, setIsAoeMode] = useState(false);
  const [showColorWheel, setShowColorWheel] = useState(false);
  // Add pinned notes state
  const [pinnedNotes, setPinnedNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showPinnedNotes, setShowPinnedNotes] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Add notes styles
  const noteStyles = StyleSheet.create({
    notesPanel: {
      backgroundColor: THEME.background.panel,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
    },
    noteInput: {
      backgroundColor: THEME.background.primary,
      borderRadius: 5,
      padding: 10,
      color: THEME.text.light,
      marginBottom: 10,
    },
    addButton: {
      backgroundColor: THEME.success,
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
      marginBottom: 10,
    },
    noteItem: {
      backgroundColor: THEME.background.primary,
      padding: 10,
      borderRadius: 5,
      marginBottom: 5,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    noteText: {
      color: THEME.text.light,
      flex: 1,
      marginRight: 10,
    },
    deleteButton: {
      padding: 5,
      borderRadius: 5,
    },
    deleteText: {
      color: THEME.danger,
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

  // Add note handling functions
  const handleAddNote = useCallback(() => {
    if (newNote.trim() && firebaseRef.current) {
      const note = { id: Date.now(), text: newNote.trim(), addedBy: playerName };
      setPinnedNotes(prev => [...prev, note]);
      setNewNote('');

      // Save to Firebase
      get(firebaseRef.current).then((snapshot) => {
        const currentData = snapshot.val() || {};
        set(firebaseRef.current, {
          ...currentData,
          pinnedNotes: [...(currentData.pinnedNotes || []), note],
          lastUpdate: Date.now()
        });
      });
    }
  }, [newNote, playerName]);

  const handleDeleteNote = useCallback((id) => {
    setPinnedNotes(prev => prev.filter(note => note.id !== id));
    
    if (firebaseRef.current) {
      get(firebaseRef.current).then((snapshot) => {
        const currentData = snapshot.val() || {};
        set(firebaseRef.current, {
          ...currentData,
          pinnedNotes: (currentData.pinnedNotes || []).filter(note => note.id !== id),
          lastUpdate: Date.now()
        });
      });
    }
  }, []);

  // Refs
  const firebaseRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Helper Functions
  const handleDisconnect = useCallback(() => {
    try {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (firebaseRef.current) {
        off(firebaseRef.current);
        firebaseRef.current = null;
      }

      // Reset room-specific state
      setIsConnected(false);
      setRoomCode('');
      setTokens({});
      setLayers(initialGameState.layers);
      setInitiative([]);
      setInCombat(false);
      setCurrentTurn(0);
      setDiceHistory([]);
      setAdvantage(false);
      setModifier(0);
      setSelectedToken(null);
      setShowTokenModal(false);
      setPartyLoot(initialGameState.partyLoot);
      setZoomLevel(isSmallScreen ? 0.8 : 1);
      // Don't clear characters or player name

    } catch (error) {
      console.error('Error during disconnect:', error);
      Alert.alert('Error', 'Failed to leave room properly. Please try again.');
    }
  }, []);

  const handleInitiativeRoll = useCallback(() => {
    if (!tokens || Object.keys(tokens).length === 0) {
      Alert.alert('Error', 'No tokens on the board');
      return;
    }

    const rolls = Object.entries(tokens).map(([position, token]) => {
      const roll = Math.floor(Math.random() * 20) + 1;
      const initiative = roll + (token.initiativeBonus || 0);
      return {
        position,
        initiative,
        details: `${token.name} (${initiative})`
      };
    });

    rolls.sort((a, b) => b.initiative - a.initiative);

    if (firebaseRef.current) {
      set(firebaseRef.current, {
        ...initialGameState,
        tokens,
        layers,
        initiative: rolls,
        inCombat: true,
        currentTurn: 0
      });
    }

    setInitiative(rolls);
    setInCombat(true);
    setCurrentTurn(0);
  }, [tokens, layers]);

  const rollDice = useCallback((sides) => {
    const allRolls = [];

    // Roll for each die in quantity
    for (let d = 0; d < diceQuantity; d++) {
      const rolls = [];
      const numRolls = rollType !== 'normal' ? 2 : 1;

      // Roll with advantage/disadvantage if enabled
      for (let i = 0; i < numRolls; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }

      const finalRoll = rollType === 'advantage' 
        ? Math.max(...rolls) 
        : rollType === 'disadvantage'
          ? Math.min(...rolls)
          : rolls[0];

      allRolls.push({
        rolls,
        total: finalRoll
      });
    }

    // Calculate grand total including modifier
    const grandTotal = allRolls.reduce((sum, roll) => sum + roll.total, 0) + modifier;

    const newResult = {
      dice: `${diceQuantity}d${sides}`,
      rolls: allRolls.map(r => r.rolls).flat(),
      individualTotals: allRolls.map(r => r.total),
      modifier,
      rollType,
      total: grandTotal,
      timestamp: Date.now()
    };

    setDiceHistory(prev => [newResult, ...prev.slice(0, 49)]);
    Vibration.vibrate(50);
  }, [rollType, modifier, diceQuantity]);

  const handleCellPress = useCallback(async (row, col) => {
    if (!firebaseRef.current) return;

    try {
      const position = `${row}-${col}`;
      
      // Handle AoE mode
      if (isAoeMode) {
        const snapshot = await get(firebaseRef.current);
        const currentRoomData = snapshot.val() || {};
        const currentAoe = currentRoomData.layers?.aoe || {};
        
        const newAoe = { ...currentAoe };
        if (newAoe[position]) {
          delete newAoe[position];
        } else {
          newAoe[position] = { color: currentColor };
        }

        await set(firebaseRef.current, {
          ...currentRoomData,
          layers: {
            ...currentRoomData.layers,
            aoe: newAoe
          },
          lastUpdate: Date.now()
        });
        return;
      }

      // Original token handling code
      const newTokens = { ...tokens };

      // First get current room data to preserve all existing data
      const snapshot = await get(firebaseRef.current);
      const currentRoomData = snapshot.val() || {};

      if (tokens[position]) {
        delete newTokens[position];
      } else {
        if (isDM) {
          setSelectedPosition(position);
          setShowEnemySelect(true);
          return;
        } else {
          // Check if a character is selected
          if (!selectedCharacter) {
            Alert.alert('No Character Selected', 'Please select a character from your list first.');
            return;
          }

          // Create token from selected character
          newTokens[position] = {
            name: selectedCharacter.name,
            color: currentColor,
            hp: selectedCharacter.hp,
            maxHp: selectedCharacter.maxHp,
            ac: selectedCharacter.ac,
            initiativeBonus: calculateModifier(selectedCharacter.abilityScores.DEX),
            effects: [],
            position,
            owner: playerName
          };
        }
      }

      // Update Firebase while preserving all existing data
      await set(firebaseRef.current, {
        ...currentRoomData,
        tokens: newTokens,
        lastUpdate: Date.now()
      });

      setTokens(newTokens);
    } catch (error) {
      console.error('Error updating tokens:', error);
      Alert.alert('Error', 'Failed to update token');
    }
  }, [tokens, isDM, selectedCharacter, playerName, currentColor, isAoeMode]);

  // Update the savePlayerData function
  const savePlayerData = useCallback(async (updatedCharacters) => {
    if (!playerName || !roomCode) return;

    try {
      // First get current room data to preserve existing data
      const roomSnapshot = await get(ref(database, `rooms/${roomCode}`));
      const currentRoomData = roomSnapshot.val() || {};

      // Save to both the room and a separate players collection
      const roomPlayerRef = ref(database, `rooms/${roomCode}/players/${playerName}`);
      const globalPlayerRef = ref(database, `players/${playerName}`);

      const playerData = {
        characters: updatedCharacters,
        lastUpdate: Date.now()
      };

      // Update both locations
      await Promise.all([
        set(roomPlayerRef, playerData),
        set(globalPlayerRef, playerData),
        // Update room data while preserving existing data
        set(ref(database, `rooms/${roomCode}`), {
          ...currentRoomData,
          players: {
            ...(currentRoomData.players || {}),
            [playerName]: playerData
          }
        })
      ]);

      // Update local state after successful save
      setCharacters(updatedCharacters);
    } catch (error) {
      console.error('Error saving player data:', error);
      Alert.alert('Error', 'Failed to save character data');
    }
  }, [playerName, roomCode]);

  // Update the connectToRoom function's onValue listener
  const connectToRoom = useCallback(async (code) => {
    if (!code.trim() || !playerName) {
      Alert.alert("Error", "Please enter a room code and player name");
      return;
    }

    setIsJoining(true);
    setIsLoading(true);

    try {
      // First try to load player's global data
      const globalPlayerRef = ref(database, `players/${playerName}`);
      const playerSnapshot = await get(globalPlayerRef);
      let savedCharacters = [];
      
      if (playerSnapshot.exists()) {
        const playerData = playerSnapshot.val();
        savedCharacters = playerData.characters || [];
        // Set characters from global data first
        setCharacters(savedCharacters);
      }

      const gameRef = ref(database, `rooms/${code}`);
      firebaseRef.current = gameRef;

      // Check if room exists
      const snapshot = await get(gameRef);
      if (!snapshot.exists()) {
        // If room doesn't exist, create it with the player's characters
        await set(gameRef, {
          ...initialGameState,
          players: {
            [playerName]: {
              characters: savedCharacters,
              lastUpdate: Date.now()
            }
          }
        });
      } else {
        // If room exists, check for room-specific character data
        const roomData = snapshot.val();
        if (!roomData.players || !roomData.players[playerName]) {
          // If no room-specific data, update room with player's global characters
          const updatedRoomData = {
            ...roomData,
            players: {
              ...(roomData.players || {}),
              [playerName]: {
                characters: savedCharacters,
                lastUpdate: Date.now()
              }
            }
          };
          await set(gameRef, updatedRoomData);
        }
      }

      // Set up real-time listener
      const unsubscribe = onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setTokens(data.tokens || {});
          setLayers(data.layers || initialGameState.layers);
          setInitiative(data.initiative || []);
          setInCombat(data.inCombat || false);
          setCurrentTurn(data.currentTurn || 0);
          setPartyLoot(data.partyLoot || initialGameState.partyLoot);
          setPinnedNotes(data.pinnedNotes || []);
          
          // Always load the campaign story text if it exists
          if (data.campaignStory?.text !== undefined) {
            setStoryText(data.campaignStory.text);
          }

          // Only update characters if they've changed and new data exists
          if (data.players?.[playerName]?.characters) {
            const newCharacters = data.players[playerName].characters;
            setCharacters(prevCharacters => {
              // Don't update if we have existing characters and new data is empty
              if (prevCharacters?.length > 0 && (!newCharacters || newCharacters.length === 0)) {
                return prevCharacters;
              }
              // Only update if the data is different
              if (JSON.stringify(newCharacters) !== JSON.stringify(prevCharacters)) {
                return newCharacters;
              }
              return prevCharacters;
            });
          }
        }
      });

      unsubscribeRef.current = unsubscribe;
      setRoomCode(code);
      setShowRoomModal(false);
      setIsConnected(true);

    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert("Error", "Failed to join room. Please try again.");
      setIsConnected(false);
    } finally {
      setIsJoining(false);
      setIsLoading(false);
    }
  }, [playerName]);

  // Effects
  useEffect(() => {
    const handleOffline = () => {
      Alert.alert(
        'Connection Lost',
        'Please check your internet connection',
        [{ text: 'OK' }]
      );
    };

    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (firebaseRef.current) {
        off(firebaseRef.current);
      }
    };
  }, []);

  // Add to styles
  const layoutStyles = {
    sidePanel: {
      backgroundColor: THEME.background.panel,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      width: '100%',
    },
    sidePanelTitle: {
      color: THEME.text.light,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    panelButton: {
      backgroundColor: THEME.background.primary,
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
      flex: 1,
    },
    panelButtonText: {
      color: THEME.text.light,
      fontWeight: 'bold',
    },
    characterItem: {
      padding: 10,
      borderRadius: 5,
      marginBottom: 5,
      backgroundColor: THEME.background.secondary,
    },
    characterInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    characterName: {
      color: THEME.text.light,
      fontWeight: 'bold',
    },
    characterDetails: {
      color: THEME.text.light,
      opacity: 0.8,
    },
  };

  // Add the delete function in App component
  const handleDeleteCharacter = useCallback(async () => {
    if (!selectedCharacter) return;

    try {
      const newCharacters = characters.filter(char => char.name !== selectedCharacter.name);
      setCharacters(newCharacters);
      await savePlayerData(newCharacters);
      setSelectedCharacter(null);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting character:', error);
      Alert.alert('Error', 'Failed to delete character');
    }
  }, [selectedCharacter, characters, savePlayerData]);

  // Add the handleEnemySelect function
  const handleEnemySelect = useCallback(async (enemy) => {
    if (!selectedPosition || !firebaseRef.current) return;

    try {
      const newTokens = { ...tokens };
      newTokens[selectedPosition] = {
        ...enemy,
        position: selectedPosition,
        effects: [],
        owner: 'DM'
      };

      // First get current room data to preserve all existing data
      const snapshot = await get(firebaseRef.current);
      const currentRoomData = snapshot.val() || {};

      // Update Firebase while preserving all existing data
      await set(firebaseRef.current, {
        ...currentRoomData,
        tokens: newTokens,
        lastUpdate: Date.now()
      });

      setTokens(newTokens);
      setShowEnemySelect(false);
      setSelectedPosition(null);
    } catch (error) {
      console.error('Error adding enemy:', error);
      Alert.alert('Error', 'Failed to add enemy');
    }
  }, [selectedPosition, tokens]);

  // Main render return
  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkMode]}>
      <View style={styles.container}>
        {/* Modals stay at the top level */}
        <TokenModal 
          showTokenModal={showTokenModal}
          setShowTokenModal={setShowTokenModal}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
          tokens={tokens}
          firebaseRef={firebaseRef}
          initialGameState={initialGameState}
          layers={layers}
          initiative={initiative}
          inCombat={inCombat}
          currentTurn={currentTurn}
          THEME={THEME}
        />

        <RoomModal 
          showRoomModal={showRoomModal}
          setShowRoomModal={setShowRoomModal}
          isConnected={isConnected}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          isJoining={isJoining}
          connectToRoom={connectToRoom}
        />

        <PlayerNameModal
          visible={showPlayerNameModal && !playerName}
          onSubmit={(name) => {
            setPlayerName(name);
            setShowPlayerNameModal(false);
            setIsConnected(true);
          }}
        />

        <DiceResultModal
          visible={showDiceResult}
          result={diceResult}
          onClose={() => setShowDiceResult(false)}
        />

        <PartyLootModal
          visible={showPartyLoot}
          onClose={() => setShowPartyLoot(false)}
          partyLoot={partyLoot}
          playerName={playerName}
          onUpdate={(updatedLoot) => {
            setPartyLoot(updatedLoot);
            if (firebaseRef.current) {
              set(firebaseRef.current, {
                ...initialGameState,
                tokens,
                layers,
                initiative,
                inCombat,
                currentTurn,
                partyLoot: updatedLoot
              });
            }
          }}
        />

        <CharacterSheetModal
          visible={showCharacterSheet}
          onClose={() => setShowCharacterSheet(false)}
          character={selectedCharacter || {
            name: '',
            class: '',
            level: 1,
            owner: playerName,
            proficiencyBonus: 2,
            hp: 0,
            maxHp: 0,
            ac: 10,
            abilityScores: {
              STR: 10,
              DEX: 10,
              CON: 10,
              INT: 10,
              WIS: 10,
              CHA: 10
            },
            proficientSkills: [],
            currency: {
              CP: 0,
              SP: 0,
              EP: 0,
              GP: 0,
              PP: 0
            },
            items: [],
            inventory: []
          }}
          characters={characters}
          onUpdate={async (updatedCharacter) => {
            try {
              if (!updatedCharacter) {
                throw new Error('No character data to save');
              }

              // Create new array with updated character
              const newCharacters = selectedCharacter
                ? characters.map(char => 
                    char.name === selectedCharacter.name ? updatedCharacter : char
                  )
                : [...characters, updatedCharacter];

              // Update local state first
              setCharacters(newCharacters);

              // Save to Firebase
              const playerRef = ref(database, `players/${playerName}`);
              await set(playerRef, {
                characters: newCharacters,
                lastUpdate: Date.now()
              });

              // Also save to room data while preserving campaign story
              if (firebaseRef.current) {
                // First get the current room data
                const roomSnapshot = await get(firebaseRef.current);
                const currentRoomData = roomSnapshot.val() || {};
                
                // Update the room data while preserving campaign story and other data
                await set(firebaseRef.current, {
                  ...currentRoomData,
                  tokens,
                  layers,
                  initiative,
                  inCombat,
                  currentTurn,
                  partyLoot,
                  characters: newCharacters,
                  lastUpdate: Date.now()
                });
              }

              setShowCharacterSheet(false);

            } catch (error) {
              console.error('Error saving character:', error);
              Alert.alert('Error', 'Failed to save character');
            }
          }}
        />

        <InventoryModal
          visible={showInventory}
          onClose={() => setShowInventory(false)}
          character={selectedCharacter}
          onUpdate={async (updatedCharacter) => {
            try {
              const newCharacters = characters.map(char => 
                char.name === selectedCharacter.name ? updatedCharacter : char
              );

              setCharacters(newCharacters);
              await savePlayerData(newCharacters);
              setShowInventory(false);
            } catch (error) {
              console.error('Error saving inventory:', error);
              Alert.alert('Error', 'Failed to save inventory');
            }
          }}
        />

        <RulesModal
          visible={showRules}
          onClose={() => setShowRules(false)}
        />

        {!isConnected ? (
          <View style={styles.loadingContainer}>
            {isLoading ? (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME.accent} />
                <Text style={[styles.loadingText, { marginTop: 20 }]}>
                  Connecting to room...
                </Text>
              </View>
            ) : (
              <Text style={styles.loadingText}>
                Enter a room code to begin
              </Text>
            )}
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>D&D Combat Tracker</Text>
              <ScrollView 
                horizontal={isSmallScreen} 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.controls}
              >
                <TouchableOpacity 
                  style={[styles.controlButton, { backgroundColor: THEME.primary }]}
                  onPress={() => setShowRoomModal(true)}
                >
                  <Text style={styles.buttonText}>Room: {roomCode}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: THEME.primary }]}
                  onPress={handleInitiativeRoll}
                >
                  <Text style={styles.buttonText}>Roll Initiative</Text>
                </TouchableOpacity>

                {inCombat && (
                  <>
                    <TouchableOpacity
                      style={[styles.controlButton, { backgroundColor: THEME.success }]}
                      onPress={() => {
                        const nextTurn = (currentTurn + 1) % initiative.length;
                        setCurrentTurn(nextTurn);
                        if (firebaseRef.current) {
                          set(firebaseRef.current, {
                            ...initialGameState,
                            tokens,
                            layers,
                            initiative,
                            inCombat: true,
                            currentTurn: nextTurn
                          });
                        }
                      }}
                    >
                      <Text style={styles.buttonText}>Next Turn</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.controlButton, { backgroundColor: THEME.danger }]}
                      onPress={() => {
                        if (firebaseRef.current) {
                          set(firebaseRef.current, {
                            ...initialGameState,
                            tokens,
                            layers,
                            initiative: [],
                            inCombat: false,
                            currentTurn: 0
                          });
                        }
                        setInitiative([]);
                        setInCombat(false);
                        setCurrentTurn(0);
                      }}
                    >
                      <Text style={styles.buttonText}>End Combat</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: THEME.danger }]}
                  onPress={() => {
                    Alert.alert(
                      "Leave Room",
                      "Are you sure you want to leave this room?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { 
                          text: "Leave", 
                          style: "destructive",
                          onPress: () => {
                            handleDisconnect();
                            setShowRoomModal(true);
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.buttonText}>Leave Room</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.controlButton,
                    isDM && styles.dmToggleActive
                  ]}
                  onPress={() => setIsDM(!isDM)}
                >
                  <Text style={styles.buttonText}>DM Mode</Text>
                </TouchableOpacity>

                {/* Add AoE toggle button to controls */}
                <View style={styles.controls}>
                  {/* ... existing control buttons ... */}
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      { backgroundColor: isAoeMode ? THEME.accent : THEME.background.secondary }
                    ]}
                    onPress={() => setIsAoeMode(!isAoeMode)}
                  >
                    <Text style={styles.buttonText}>AoE Mode</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      { backgroundColor: showPinnedNotes ? THEME.accent : THEME.background.secondary }
                    ]}
                    onPress={() => setShowPinnedNotes(!showPinnedNotes)}
                  >
                    <Text style={styles.buttonText}>Pinned Notes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      { backgroundColor: showRules ? THEME.accent : THEME.background.secondary }
                    ]}
                    onPress={() => setShowRules(!showRules)}
                  >
                    <Text style={styles.buttonText}>Rules</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
            <ScrollView style={styles.content}>
              <View style={styles.mainArea}>
                {/* Left Sidebar - Dice Roller */}
                <View style={styles.leftSidebar}>
                  <View style={diceStyles.dicePanel}>
                    <Text style={diceStyles.diceTitle}>Dice Roller</Text>
                    <View style={diceStyles.diceControls}>
                      <View style={diceStyles.controlsRow}>
                        <View style={diceStyles.controlGroup}>
                          <TouchableOpacity
                            style={[
                              diceStyles.controlButton,
                              rollType === 'advantage' && diceStyles.controlActive,
                              rollType === 'advantage' && { backgroundColor: THEME.success }
                            ]}
                            onPress={() => setRollType(current => 
                              current === 'advantage' ? 'normal' : 'advantage'
                            )}
                          >
                            <Text style={styles.buttonText}>Advantage</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              diceStyles.controlButton,
                              rollType === 'disadvantage' && diceStyles.controlActive,
                              rollType === 'disadvantage' && { backgroundColor: THEME.danger }
                            ]}
                            onPress={() => setRollType(current => 
                              current === 'disadvantage' ? 'normal' : 'disadvantage'
                            )}
                          >
                            <Text style={styles.buttonText}>Disadvantage</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={diceStyles.controlsRow}>
                        <View style={diceStyles.modifierGroup}>
                          <Text style={diceStyles.modifierLabel}>Modifier</Text>
                          <TextInput
                            style={diceStyles.modifierInput}
                            value={String(modifier)}
                            onChangeText={text => {
                              const num = parseInt(text) || 0;
                              setModifier(num);
                            }}
                            keyboardType="numeric"
                            selectTextOnFocus={true}
                          />
                        </View>
                        <View style={diceStyles.quantityGroup}>
                          <Text style={diceStyles.quantityLabel}>Quantity</Text>
                          <TextInput
                            style={diceStyles.quantityInput}
                            value={String(diceQuantity)}
                            onChangeText={text => {
                              const num = parseInt(text) || 1;
                              setDiceQuantity(Math.max(1, Math.min(num, 100)));
                            }}
                            keyboardType="numeric"
                            selectTextOnFocus={true}
                          />
                        </View>
                      </View>
                    </View>

                    <View style={diceStyles.diceGrid}>
                      {DICE_TYPES.map(({ sides }) => (
                        <TouchableOpacity
                          key={sides}
                          style={[diceStyles.diceButton, { backgroundColor: THEME.background.secondary }]}
                          onPress={() => {
                            const rolls = [];
                            for (let i = 0; i < diceQuantity; i++) {
                              if (rollType !== 'normal') {
                                const roll1 = Math.floor(Math.random() * sides) + 1;
                                const roll2 = Math.floor(Math.random() * sides) + 1;
                                rolls.push(rollType === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2));
                              } else {
                                rolls.push(Math.floor(Math.random() * sides) + 1);
                              }
                            }

                            const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
                            const result = {
                              dice: `${diceQuantity}d${sides}`,
                              rolls,
                              modifier,
                              rollType,
                              total
                            };

                            setDiceResult(result);
                            setShowDiceResult(true);
                            Vibration.vibrate(50);
                          }}
                        >
                          <Text style={diceStyles.diceButtonText}>d{sides}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Player Tools Panel */}
                  <View style={styles.infoPanel}>
                    <Text style={styles.infoPanelTitle}>Player Tools</Text>
                    <View style={styles.infoGrid}>
                      <TouchableOpacity 
                        style={styles.quickActionButton}
                        onPress={() => {
                          const roll = Math.floor(Math.random() * 20) + 1;
                          setDiceResult({
                            dice: "d20",
                            rolls: [roll],
                            modifier: 0,
                            rollType: 'normal',
                            total: roll
                          });
                          setShowDiceResult(true);
                        }}
                      >
                        <Text style={styles.quickActionText}>Quick d20</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.quickActionButton}
                        onPress={() => {
                          const roll1 = Math.floor(Math.random() * 20) + 1;
                          const roll2 = Math.floor(Math.random() * 20) + 1;
                          const total = Math.max(roll1, roll2);
                          setDiceResult({
                            dice: "d20 with advantage",
                            rolls: [roll1, roll2],
                            modifier: 0,
                            rollType: 'advantage',
                            total
                          });
                          setShowDiceResult(true);
                        }}
                      >
                        <Text style={styles.quickActionText}>Quick Advantage</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.quickActionButton}
                        onPress={() => {
                          const damage = Math.floor(Math.random() * 8) + 1;
                          setDiceResult({
                            dice: "d8",
                            rolls: [damage],
                            modifier: 0,
                            rollType: 'normal',
                            total: damage
                          });
                          setShowDiceResult(true);
                        }}
                      >
                        <Text style={styles.quickActionText}>Quick Damage</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.quickActionButton}
                        onPress={() => {
                          const roll1 = Math.floor(Math.random() * 20) + 1;
                          const roll2 = Math.floor(Math.random() * 20) + 1;
                          const total = Math.min(roll1, roll2);
                          setDiceResult({
                            dice: "d20 with disadvantage",
                            rolls: [roll1, roll2],
                            modifier: 0,
                            rollType: 'disadvantage',
                            total
                          });
                          setShowDiceResult(true);
                        }}
                      >
                        <Text style={styles.quickActionText}>Quick Disadvantage</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoGrid}>
                      <TouchableOpacity 
                        style={[styles.quickActionButton, { backgroundColor: THEME.accent }]}
                        onPress={() => {
                          const rolls = [
                            Math.floor(Math.random() * 6) + 1,
                            Math.floor(Math.random() * 6) + 1,
                            Math.floor(Math.random() * 6) + 1,
                            Math.floor(Math.random() * 6) + 1
                          ].sort((a, b) => b - a);
                          // Drop lowest roll
                          rolls.pop();
                          const total = rolls.reduce((sum, roll) => sum + roll, 0);
                          setDiceResult({
                            dice: "4d6 drop lowest",
                            rolls: rolls,
                            modifier: 0,
                            rollType: 'normal',
                            total
                          });
                          setShowDiceResult(true);
                        }}
                      >
                        <Text style={styles.quickActionText}>Roll Ability Score</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.quickActionButton, { backgroundColor: THEME.success }]}
                        onPress={() => {
                          const roll = Math.floor(Math.random() * 100) + 1;
                          setDiceResult({
                            dice: "d100",
                            rolls: [roll],
                            modifier: 0,
                            rollType: 'normal',
                            total: roll
                          });
                          setShowDiceResult(true);
                        }}
                      >
                        <Text style={styles.quickActionText}>Percentile Roll</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Grid Section */}
                <View style={styles.gridSection}>
                  <ScrollView 
                    horizontal 
                    contentContainerStyle={{ minWidth: '100%' }}
                  >
                    <ScrollView>
                      <View style={[
                        styles.gridContainer,
                        { transform: [{ scale: zoomLevel }] }
                      ]}>
                        {/* Color Picker */}
                        <View style={styles.colorPicker}>
                          <TouchableOpacity
                            style={[
                              styles.colorButton,
                              { backgroundColor: currentColor, width: 40, height: 40 }
                            ]}
                            onPress={() => setShowColorWheel(true)}
                          />
                        </View>

                        {/* Grid */}
                        {Array.from({ length: GRID_SIZE }).map((_, row) => (
                          <View key={row} style={styles.row}>
                            {Array.from({ length: GRID_SIZE }).map((_, col) => {
                              const position = `${row}-${col}`;
                              const token = tokens[position];
                              const isCurrentTurn = inCombat && 
                                initiative[currentTurn]?.position === position;

                              return (
                                <TouchableOpacity
                                  key={col}
                                  style={[
                                    styles.cell,
                                    token && { backgroundColor: token.color },
                                    layers.aoe?.[position] && {
                                      backgroundColor: layers.aoe[position].color,
                                      opacity: 0.5
                                    },
                                    isCurrentTurn && styles.currentTurn
                                  ]}
                                  onPress={() => handleCellPress(row, col)}
                                  onLongPress={() => {
                                    if (token) {
                                      setSelectedToken({ ...token, position });
                                      setShowTokenModal(true);
                                    }
                                  }}
                                >
                                  {token && (
                                    <View style={styles.tokenContent}>
                                      <Text style={[
                                        styles.tokenText,
                                        { color: token.color === '#ffffff' ? '#000000' : '#ffffff' }
                                      ]} numberOfLines={1}>
                                        {token.name}
                                      </Text>
                                      <Text style={[
                                        styles.tokenHp,
                                        { color: token.color === '#ffffff' ? '#000000' : '#ffffff' }
                                      ]}>
                                        HP: {token.hp}/{token.maxHp}
                                      </Text>
                                      <Text style={[
                                        styles.tokenHp,
                                        { color: token.color === '#ffffff' ? '#000000' : '#ffffff' }
                                      ]}>
                                        AC: {token.ac}
                                      </Text>
                                      {token.effects && token.effects.length > 0 && (
                                        <View style={statusStyles.tokenEffects}>
                                          {token.effects.map(effect => {
                                            const statusEffect = STATUS_EFFECTS.find(e => e.id === effect);
                                            return statusEffect ? (
                                              <Text key={effect} style={statusStyles.effectIcon}>
                                                {statusEffect.icon}
                                              </Text>
                                            ) : null;
                                          })}
                                        </View>
                                      )}
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </ScrollView>
                  <GridZoomControls 
                    zoomLevel={zoomLevel}
                    setZoomLevel={setZoomLevel}
                  />

                  {/* Campaign Story Panel */}
                  <View style={[styles.infoPanel, { marginTop: 20 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={styles.infoPanelTitle}>Campaign Story</Text>
                      {isDM && (
                        <TouchableOpacity
                          style={[styles.quickActionButton, { backgroundColor: THEME.accent, width: 100 }]}
                          onPress={() => {
                            if (firebaseRef.current) {
                              // First get the current room data
                              get(firebaseRef.current).then((snapshot) => {
                                const currentRoomData = snapshot.val() || {};
                                
                                // Update the room data while preserving all existing data
                                set(firebaseRef.current, {
                                  ...currentRoomData,
                                  campaignStory: {
                                    text: storyText,
                                    lastUpdate: Date.now(),
                                    updatedBy: playerName
                                  }
                                });
                              });
                            }
                          }}
                        >
                          <Text style={styles.quickActionText}>Save Story</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          height: 200,
                          textAlignVertical: 'top',
                          padding: 10,
                          backgroundColor: THEME.background.secondary,
                          color: THEME.text.light,
                          fontSize: 14,
                          lineHeight: 20,
                          marginBottom: 10
                        }
                      ]}
                      multiline={true}
                      value={storyText}
                      onChangeText={isDM ? setStoryText : undefined}
                      editable={isDM}
                      placeholder="Type or paste your campaign story here..."
                      placeholderTextColor={THEME.text.light + '80'}
                    />
                    {initialGameState.campaignStory?.updatedBy && (
                      <Text style={[styles.infoLabel, { textAlign: 'right' }]}>
                        Last updated by {initialGameState.campaignStory.updatedBy}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Right Sidebar - Character Management & Combat */}
                <View style={styles.rightSidebar}>
                  {/* Quick Actions */}
                  <View style={styles.quickActions}>
                    <TouchableOpacity 
                      style={styles.quickActionButton}
                      onPress={() => setShowCharacterSheet(true)}
                    >
                      <Text style={styles.quickActionText}>New Character</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickActionButton}
                      onPress={() => setShowPartyLoot(true)}
                    >
                      <Text style={styles.quickActionText}>Party Loot</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickActionButton}
                      onPress={handleInitiativeRoll}
                    >
                      <Text style={styles.quickActionText}>Roll Initiative</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.quickActionButton, { backgroundColor: THEME.danger }]}
                      onPress={() => {
                        if (firebaseRef.current) {
                          set(firebaseRef.current, {
                            ...initialGameState,
                            tokens: {},
                            layers,
                            initiative: [],
                            inCombat: false,
                            currentTurn: 0,
                            partyLoot,
                            characters
                          });
                          setTokens({});
                          setInitiative([]);
                          setInCombat(false);
                          setCurrentTurn(0);
                        }
                      }}
                    >
                      <Text style={styles.quickActionText}>Clear Board</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Character Management Panel */}
                  <View style={[styles.infoPanel, { marginBottom: 15 }]}>
                    <Text style={styles.infoPanelTitle}>Characters</Text>
                    <ScrollView style={{ maxHeight: 200 }}>
                      {characters
                        .filter(char => char.owner === playerName)
                        .map((char, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              layoutStyles.characterItem,
                              selectedCharacter?.name === char.name && { backgroundColor: THEME.accent + '40' }
                            ]}
                            onPress={() => setSelectedCharacter(char)}
                          >
                            <View style={layoutStyles.characterInfo}>
                              <View>
                                <Text style={layoutStyles.characterName}>{char.name}</Text>
                                <Text style={layoutStyles.characterDetails}>
                                  Level {char.level} {char.class}
                                </Text>
                              </View>
                              <View style={styles.statBadge}>
                                <Text style={styles.statBadgeText}>
                                  HP: {char.hp}/{char.maxHp}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                    
                    {selectedCharacter && (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.infoGrid}>
                          <TouchableOpacity
                            style={[styles.quickActionButton, { backgroundColor: THEME.accent }]}
                            onPress={() => setShowCharacterSheet(true)}
                          >
                            <Text style={styles.quickActionText}>Character Sheet</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.quickActionButton, { backgroundColor: THEME.success }]}
                            onPress={() => setShowInventory(true)}
                          >
                            <Text style={styles.quickActionText}>Inventory</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.quickActionButton, { backgroundColor: THEME.danger }]}
                            onPress={() => setShowDeleteModal(true)}
                          >
                            <Text style={styles.quickActionText}>Delete Character</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>

                  {/* Combat Tracker Panel */}
                  <View style={styles.infoPanel}>
                    <Text style={styles.infoPanelTitle}>Combat Tracker</Text>
                    <View style={styles.infoGrid}>
                      <TouchableOpacity 
                        style={[styles.quickActionButton, inCombat ? { backgroundColor: THEME.danger } : {}]}
                        onPress={() => {
                          if (inCombat) {
                            if (firebaseRef.current) {
                              set(firebaseRef.current, {
                                ...initialGameState,
                                tokens,
                                layers,
                                initiative: [],
                                inCombat: false,
                                currentTurn: 0
                              });
                            }
                            setInitiative([]);
                            setInCombat(false);
                            setCurrentTurn(0);
                          } else {
                            handleInitiativeRoll();
                          }
                        }}
                      >
                        <Text style={styles.quickActionText}>
                          {inCombat ? 'End Combat' : 'Start Combat'}
                        </Text>
                      </TouchableOpacity>
                      
                      {inCombat && (
                        <TouchableOpacity
                          style={[styles.quickActionButton, { backgroundColor: THEME.success }]}
                          onPress={() => {
                            const nextTurn = (currentTurn + 1) % initiative.length;
                            setCurrentTurn(nextTurn);
                            if (firebaseRef.current) {
                              set(firebaseRef.current, {
                                ...initialGameState,
                                tokens,
                                layers,
                                initiative,
                                inCombat: true,
                                currentTurn: nextTurn
                              });
                            }
                          }}
                        >
                          <Text style={styles.quickActionText}>Next Turn</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {inCombat && initiative.length > 0 && (
                      <>
                        <View style={styles.divider} />
                        <Text style={[styles.infoPanelTitle, { fontSize: 14 }]}>Current Turn</Text>
                        <View style={[styles.infoCard, { marginBottom: 10 }]}>
                          <Text style={styles.infoValue}>
                            {tokens[initiative[currentTurn]?.position]?.name || 'Unknown'}
                          </Text>
                          <Text style={styles.infoLabel}>
                            Initiative: {initiative[currentTurn]?.initiative || '0'}
                          </Text>
                        </View>
                        
                        <Text style={[styles.infoPanelTitle, { fontSize: 14 }]}>Initiative Order</Text>
                        <ScrollView style={{ maxHeight: 150 }}>
                          {initiative.map((item, index) => {
                            const token = tokens[item.position];
                            if (!token) return null;
                            return (
                              <View 
                                key={item.position}
                                style={[
                                  styles.infoCard,
                                  { marginBottom: 5 },
                                  index === currentTurn && { backgroundColor: THEME.accent + '40' }
                                ]}
                              >
                                <Text style={styles.infoValue}>{token.name}</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                  <Text style={styles.infoLabel}>Initiative: {item.initiative}</Text>
                                  <Text style={styles.infoLabel}>HP: {token.hp}/{token.maxHp}</Text>
                                </View>
                              </View>
                            );
                          })}
                        </ScrollView>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>
          </>
        )}
      </View>
      <DeleteCharacterModal
        visible={showDeleteModal}
        character={selectedCharacter}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCharacter}
      />
      <EnemySelectModal
        visible={showEnemySelect}
        onClose={() => {
          setShowEnemySelect(false);
          setSelectedPosition(null);
        }}
        onSelect={handleEnemySelect}
      />
      <ColorWheelModal
        visible={showColorWheel}
        onClose={() => setShowColorWheel(false)}
        onSelectColor={setCurrentColor}
        initialColor={currentColor}
      />
      <PinnedNotesModal
        visible={showPinnedNotes}
        onClose={() => setShowPinnedNotes(false)}
        notes={pinnedNotes}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        newNote={newNote}
        setNewNote={setNewNote}
      />
    </SafeAreaView>
  );
}
