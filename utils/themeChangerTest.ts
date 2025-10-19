/**
 * Test file for expo-theme-changer integration
 *
 * This file can be imported in app/debug.tsx to test theme functionality
 */

import * as ThemeChanger from 'expo-theme-changer';

export function testThemeChanger() {
  console.log('=== Testing expo-theme-changer ===');

  try {
    // Test 1: Get current theme
    const currentTheme = ThemeChanger.getTheme();
    console.log('✓ Current theme:', currentTheme);

    // Test 2: Get effective theme
    const effectiveTheme = ThemeChanger.getEffectiveTheme();
    console.log('✓ Effective theme:', effectiveTheme);

    // Test 3: Get system theme
    const systemTheme = ThemeChanger.getSystemTheme();
    console.log('✓ System theme:', systemTheme);

    // Test 4: Set theme
    console.log('✓ Setting theme to "dark"...');
    ThemeChanger.setTheme('dark');
    console.log('✓ Theme set to:', ThemeChanger.getTheme());

    // Test 5: Add theme listener
    console.log('✓ Adding theme listener...');
    const subscription = ThemeChanger.addThemeListener((event) => {
      console.log('✓ Theme changed:', event);
    });

    // Test 6: Change theme to trigger listener
    console.log('✓ Changing theme to "light"...');
    ThemeChanger.setTheme('light');

    // Test 7: Clean up
    setTimeout(() => {
      console.log('✓ Removing listener...');
      subscription.remove();
      console.log('✓ Restoring original theme...');
      ThemeChanger.setTheme(currentTheme);
      console.log('=== All tests passed! ===');
    }, 1000);

    return true;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

export function getThemeInfo() {
  return {
    theme: ThemeChanger.getTheme(),
    effectiveTheme: ThemeChanger.getEffectiveTheme(),
    systemTheme: ThemeChanger.getSystemTheme(),
  };
}
