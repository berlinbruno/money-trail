import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Label } from './label';

interface BaseModalProps {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
}

export default function BaseModal({ visible, title, children, onClose }: BaseModalProps) {
  return (
    <Modal animationType="slide" visible={visible} transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/40">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 40}
            className="w-full">
            <ScrollView>
              <Pressable
                className="rounded-t-2xl bg-background p-5"
                onPress={() => Keyboard.dismiss()}>
                <Label className="text-center">{title}</Label>
                {children}
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
