import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

/**
 * Cross-platform alert that works on both native and web.
 * On web, falls back to window.confirm / window.alert.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  // Web fallback
  if (!buttons || buttons.length === 0) {
    window.alert(`${title}\n${message || ''}`);
    return;
  }

  // If there's only one button (acknowledgement alert)
  if (buttons.length === 1) {
    window.alert(`${title}\n${message || ''}`);
    buttons[0].onPress?.();
    return;
  }

  // If there are two buttons, one cancel + one action (confirm dialog)
  const cancelBtn = buttons.find(b => b.style === 'cancel');
  const actionBtn = buttons.find(b => b.style !== 'cancel') || buttons[1];

  const confirmed = window.confirm(`${title}\n${message || ''}`);
  if (confirmed) {
    actionBtn?.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}

/**
 * Show a success alert with a callback after dismissal.
 */
export function showSuccess(title: string, message: string, onDismiss?: () => void) {
  showAlert(title, message, [
    { text: 'OK', onPress: onDismiss },
  ]);
}
