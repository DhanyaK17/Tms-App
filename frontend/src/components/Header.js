import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useResponsive } from '../utils/responsive';
import Badge from './Badge';

export const Header = ({ currentRoute, onNavigate }) => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const { isMobile, isSmallMobile, width } = useResponsive();
  const [popupMenuOpen, setPopupMenuOpen] = useState(false);

  // Close popup with Escape on Web
  useEffect(() => {
    if (Platform.OS === 'web' && popupMenuOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setPopupMenuOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [popupMenuOpen]);

  const handleLogout = async () => {
    setPopupMenuOpen(false);
    await logout();
  };

  const navTo = (route) => {
    setPopupMenuOpen(false);
    if (onNavigate) {
      onNavigate(route);
    }
  };

  const isActive = (route) => currentRoute === route;

  // Primary desktop bar links (compact selection)
  const getDesktopQuickLinks = () => {
    if (!isAuthenticated) {
      return [{ route: 'Login', label: 'Login', icon: 'log-in-outline' }];
    }

    const links = [{ route: 'Home', label: 'Dashboard', icon: 'speedometer-outline' }];

    if (['SuperAdmin', 'User'].includes(user?.role)) {
      links.push({ route: 'ComplaintForm', label: 'Raise Ticket', icon: 'create-outline', highlight: true });
    }

    if (user?.role === 'SuperAdmin') {
      links.push({ route: 'Complaints', label: 'Tickets', icon: 'folder-outline' });
      links.push({ route: 'Reports', label: 'Reports', icon: 'bar-chart-outline' });
    } else {
      links.push({ route: 'UserComplaints', label: 'My Tickets', icon: 'clipboard-outline' });
      if (user?.role !== 'User') {
        links.push({ route: 'Complaints', label: 'Assigned', icon: 'construct-outline' });
      }
    }

    return links;
  };

  // Directory Modules (Admin only)
  const directoryModules = [
    { route: 'Departments', label: 'Departments', icon: 'business-outline', desc: 'Org units & codes' },
    { route: 'Programmes', label: 'Programmes', icon: 'school-outline', desc: 'Academic tracks' },
    { route: 'Blocks', label: 'Blocks', icon: 'cube-outline', desc: 'Facility blocks' },
    { route: 'Rooms', label: 'Rooms', icon: 'key-outline', desc: 'Allocated spaces' },
    { route: 'Users', label: 'Users', icon: 'people-outline', desc: 'Staff & operators' },
    { route: 'Roles', label: 'Roles', icon: 'shield-checkmark-outline', desc: 'Security matrix' },
  ];

  // Core navigation destinations for Pop-up
  const getCoreModules = () => {
    const list = [
      { route: 'Home', label: 'Dashboard', icon: 'speedometer-outline', desc: 'Operational overview' },
    ];

    if (user?.role === 'SuperAdmin') {
      list.push({ route: 'Complaints', label: 'Global Tickets', icon: 'folder-outline', desc: 'Central triage' });
      list.push({ route: 'Reports', label: 'Intelligence Reports', icon: 'bar-chart-outline', desc: 'Exports & analytics' });
    } else {
      list.push({ route: 'UserComplaints', label: 'My Tickets', icon: 'clipboard-outline', desc: 'Personal dossier' });
      if (user?.role !== 'User') {
        list.push({ route: 'Complaints', label: 'Assigned Work', icon: 'construct-outline', desc: 'Field dispatches' });
      }
    }

    return list;
  };

  const desktopLinks = getDesktopQuickLinks();
  const coreModules = getCoreModules();
  const showWideNav = width >= 900;

  return (
    <View style={styles.outerContainer}>
      {/* Floating Island Pop-up Capsule Navbar */}
      <View style={[styles.floatingBar, isSmallMobile && styles.floatingBarSmall]}>
        {/* Left: Brand Identity */}
        <Pressable
          style={({ pressed }) => [styles.brand, pressed && styles.brandPressed]}
          onPress={() => navTo('Home')}
        >
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>T</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>TMS</Text>
            <Text style={styles.brandSub}>PLATFORM</Text>
          </View>
        </Pressable>

        {/* Center: Desktop Quick Pills */}
        {showWideNav && isAuthenticated && (
          <View style={styles.desktopPillRow}>
            {desktopLinks.map((link) => (
              <Pressable
                key={link.route}
                style={[
                  styles.pillNav,
                  isActive(link.route) && styles.pillNavActive,
                  link.highlight && styles.pillNavHighlight,
                ]}
                onPress={() => navTo(link.route)}
              >
                <Ionicons
                  name={link.icon}
                  size={14}
                  color={isActive(link.route) ? COLORS.primary : link.highlight ? COLORS.primary : COLORS.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.pillNavText,
                    isActive(link.route) && styles.pillNavTextActive,
                    link.highlight && styles.pillNavTextHighlight,
                  ]}
                >
                  {link.label}
                </Text>
              </Pressable>
            ))}

            {/* Quick Pop-up Menu Trigger on Desktop */}
            <Pressable
              style={({ pressed }) => [
                styles.popupTriggerBtn,
                popupMenuOpen && styles.popupTriggerBtnActive,
                pressed && styles.btnPressed,
              ]}
              onPress={() => setPopupMenuOpen(true)}
            >
              <Ionicons name="grid-outline" size={14} color={COLORS.primary} style={{ marginRight: 5 }} />
              <Text style={styles.popupTriggerText}>Modules ⊞</Text>
            </Pressable>
          </View>
        )}

        {/* Right: Controls & Mobile Pop-up Trigger */}
        <View style={styles.rightControls}>
          {isAuthenticated && (
            <Pressable
              style={({ pressed }) => [styles.userChip, pressed && styles.chipPressed]}
              onPress={() => navTo('Profile')}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
                <View style={styles.onlineDot} />
              </View>
              {!isMobile && (
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.username}
                  </Text>
                  <Text style={styles.userRole}>{user?.role}</Text>
                </View>
              )}
            </Pressable>
          )}

          {/* Mobile Pop-up Menu Launcher Pill */}
          {!showWideNav && (
            <Pressable
              style={({ pressed }) => [
                styles.mobilePopLauncher,
                popupMenuOpen && styles.mobilePopLauncherActive,
                pressed && styles.btnPressed,
              ]}
              onPress={() => setPopupMenuOpen(!popupMenuOpen)}
              hitSlop={8}
            >
              <Ionicons
                name={popupMenuOpen ? 'close' : 'apps'}
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.mobilePopLauncherText}>
                {popupMenuOpen ? 'Close' : 'Menu'}
              </Text>
            </Pressable>
          )}

          {/* Desktop Fast Logout */}
          {isAuthenticated && !isMobile && (
            <Pressable
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.btnPressed]}
              onPress={handleLogout}
              hitSlop={8}
            >
              <Ionicons name="log-out-outline" size={17} color={COLORS.red} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ========================================================= */}
      {/* RESPONSIVE POP-UP NAVIGATION MODAL                      */}
      {/* ========================================================= */}
      <Modal
        visible={popupMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPopupMenuOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.popOverlay}
        >
          {/* Backdrop Blur Dismiss */}
          <Pressable style={styles.popBackdrop} onPress={() => setPopupMenuOpen(false)} />

          {/* Floating Pop-up Card */}
          <View style={[styles.popCard, isSmallMobile && styles.popCardSmall]}>
            {/* Pop-up Top Neon Header */}
            <View style={styles.popHeader}>
              <View style={styles.popHeaderBrand}>
                <View style={styles.popBadgeMini}>
                  <Text style={styles.popBadgeMiniText}>T</Text>
                </View>
                <View>
                  <Text style={styles.popHeaderTitle}>TMS NAVIGATION HUB</Text>
                  <Text style={styles.popHeaderSubtitle}>SYSTEM COMMAND MATRIX</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.popCloseBtn, pressed && styles.btnPressed]}
                onPress={() => setPopupMenuOpen(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.popBody}
              contentContainerStyle={styles.popBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {/* User Identity Pod inside Pop-up */}
              {isAuthenticated && (
                <Pressable
                  style={({ pressed }) => [styles.popUserCard, pressed && styles.chipPressed]}
                  onPress={() => navTo('Profile')}
                >
                  <View style={styles.popUserAvatar}>
                    <Text style={styles.popUserAvatarText}>
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                    <View style={styles.onlineDotLarge} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.popUserNameRow}>
                      <Text style={styles.popUserName}>{user?.username}</Text>
                      <Badge status={user?.role} size="sm" style={{ marginLeft: 6 }} />
                    </View>
                    <Text style={styles.popUserEmail}>{user?.email}</Text>
                  </View>
                  <View style={styles.popProfileLink}>
                    <Text style={styles.popProfileLinkText}>Profile</Text>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                  </View>
                </Pressable>
              )}

              {/* Quick Action: Raise Ticket (If allowed) */}
              {['SuperAdmin', 'User'].includes(user?.role) && (
                <Pressable
                  style={({ pressed }) => [
                    styles.popRaiseTicketBtn,
                    pressed && styles.btnPressed,
                    isActive('ComplaintForm') && styles.popRaiseTicketActive,
                  ]}
                  onPress={() => navTo('ComplaintForm')}
                >
                  <View style={styles.popRaiseIconBox}>
                    <Ionicons name="create" size={18} color="#040810" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.popRaiseTitle}>⚡ Raise Incident Ticket</Text>
                    <Text style={styles.popRaiseDesc}>Log operational issue or facility fault</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color="#040810" />
                </Pressable>
              )}

              {/* Section 1: Core Operations */}
              <View style={styles.popSection}>
                <Text style={styles.popSectionTitle}>OPERATIONAL MODULES</Text>
                <View style={styles.popGrid}>
                  {coreModules.map((item) => {
                    const active = isActive(item.route);
                    return (
                      <Pressable
                        key={item.route}
                        style={({ pressed }) => [
                          styles.popGridCard,
                          active && styles.popGridCardActive,
                          pressed && styles.cardPressed,
                        ]}
                        onPress={() => navTo(item.route)}
                      >
                        <View style={[styles.popIconCircle, active && styles.popIconCircleActive]}>
                          <Ionicons
                            name={item.icon}
                            size={18}
                            color={active ? COLORS.primary : COLORS.textSecondary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.popCardTitle, active && styles.popCardTitleActive]}>
                            {item.label}
                          </Text>
                          <Text style={styles.popCardDesc} numberOfLines={1}>
                            {item.desc}
                          </Text>
                        </View>
                        {active && (
                          <View style={styles.activeDot} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Section 2: Facility Directory (SuperAdmin) */}
              {user?.role === 'SuperAdmin' && (
                <View style={styles.popSection}>
                  <Text style={styles.popSectionTitle}>FACILITY DIRECTORY & ACCESS</Text>
                  <View style={styles.popDirectoryGrid}>
                    {directoryModules.map((item) => {
                      const active = isActive(item.route);
                      return (
                        <Pressable
                          key={item.route}
                          style={({ pressed }) => [
                            styles.popDirectoryCard,
                            active && styles.popDirectoryCardActive,
                            pressed && styles.cardPressed,
                          ]}
                          onPress={() => navTo(item.route)}
                        >
                          <View style={[styles.popDirIconBox, active && styles.popDirIconBoxActive]}>
                            <Ionicons
                              name={item.icon}
                              size={16}
                              color={active ? COLORS.primary : COLORS.textMuted}
                            />
                          </View>
                          <Text style={[styles.popDirTitle, active && styles.popDirTitleActive]} numberOfLines={1}>
                            {item.label}
                          </Text>
                          <Text style={styles.popDirDesc} numberOfLines={1}>
                            {item.desc}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Section 3: Footer Session Actions */}
              <View style={styles.popFooter}>
                {isAuthenticated ? (
                  <Pressable
                    style={({ pressed }) => [styles.popLogoutBtn, pressed && styles.btnPressed]}
                    onPress={handleLogout}
                  >
                    <Ionicons name="log-out-outline" size={17} color={COLORS.red} style={{ marginRight: 8 }} />
                    <Text style={styles.popLogoutText}>Terminate Current Session</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.popLoginBtn, pressed && styles.btnPressed]}
                    onPress={() => navTo('Login')}
                  >
                    <Ionicons name="log-in-outline" size={17} color={COLORS.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.popLoginText}>Operator Sign In</Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#040810',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'web' ? SPACING.sm : 4,
    paddingBottom: SPACING.xs,
    zIndex: 100,
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(13, 21, 36, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.22)',
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    minHeight: 56,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.45), 0px 0px 14px rgba(0, 229, 255, 0.12)',
        backdropFilter: 'blur(12px)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  floatingBarSmall: {
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  brandPressed: {
    opacity: 0.85,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    ...Platform.select({
      web: {
        boxShadow: '0px 0px 10px rgba(0, 229, 255, 0.5)',
      },
    }),
  },
  logoBadgeText: {
    color: '#040810',
    fontWeight: '900',
    fontSize: 18,
  },
  brandTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    lineHeight: 16,
  },
  brandSub: {
    color: COLORS.primary,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  desktopPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  pillNavActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: 'rgba(0, 229, 255, 0.35)',
  },
  pillNavHighlight: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  pillNavText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pillNavTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  pillNavTextHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  popupTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    marginLeft: 4,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  popupTriggerBtnActive: {
    backgroundColor: COLORS.primary,
  },
  popupTriggerText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  chipPressed: {
    opacity: 0.8,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 11,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  userInfo: {
    marginLeft: 6,
  },
  userName: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 90,
  },
  userRole: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '600',
  },
  mobilePopLauncher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  mobilePopLauncherActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
    borderColor: COLORS.primary,
  },
  mobilePopLauncherText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  logoutBtn: {
    padding: 7,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },

  /* ========================================================= */
  /* POP-UP MODAL STYLES                                       */
  /* ========================================================= */
  popOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 8, 16, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  popBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  popCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor: '#0c1424',
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 20px 50px rgba(0, 0, 0, 0.8), 0px 0px 30px rgba(0, 229, 255, 0.18)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
      },
    }),
  },
  popCardSmall: {
    maxHeight: '94%',
    borderRadius: RADIUS.lg,
  },
  popHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.12)',
    backgroundColor: 'rgba(0, 229, 255, 0.03)',
  },
  popHeaderBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popBadgeMini: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  popBadgeMiniText: {
    color: '#040810',
    fontSize: 14,
    fontWeight: '900',
  },
  popHeaderTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  popHeaderSubtitle: {
    color: COLORS.primary,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  popCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  popBody: {
    flexGrow: 0,
  },
  popBodyContent: {
    padding: SPACING.lg,
  },
  popUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.18)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  popUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    position: 'relative',
  },
  popUserAvatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  onlineDotLarge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green,
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderWidth: 1.5,
    borderColor: '#0c1424',
  },
  popUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popUserName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  popUserEmail: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  popProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  popProfileLinkText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    marginRight: 2,
  },
  popRaiseTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0px 4px 15px rgba(0, 229, 255, 0.35)',
      },
    }),
  },
  popRaiseTicketActive: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  popRaiseIconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  popRaiseTitle: {
    color: '#040810',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  popRaiseDesc: {
    color: 'rgba(4, 8, 16, 0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  popSection: {
    marginBottom: SPACING.lg,
  },
  popSectionTitle: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  popGrid: {
    gap: 8,
  },
  popGridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  popGridCardActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderColor: 'rgba(0, 229, 255, 0.4)',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  popIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  popIconCircleActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  popCardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  popCardTitleActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  popCardDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primary,
    marginRight: 4,
    ...Platform.select({
      web: {
        boxShadow: '0px 0px 6px #00e5ff',
      },
    }),
  },
  popDirectoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  popDirectoryCard: {
    width: '33.33%',
    padding: 4,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  popDirIconBox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  popDirIconBoxActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  popDirectoryCardActive: {
    // handled via sub-elements
  },
  popDirTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  popDirTitleActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  popDirDesc: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  popFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: SPACING.md,
  },
  popLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  popLogoutText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '700',
  },
  popLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  popLoginText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default Header;
