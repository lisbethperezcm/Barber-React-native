// components/ui/Header.tsx
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native'; // 👈 usa el icono vectorial, no emoji
import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  title?: string;
  notifications?: number;
  right?: React.ReactNode;
  onPressBell?: () => void;
};

export default function Header({
  title = 'VIP Stylist',
  notifications = 3,
  right,
  onPressBell,
}: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return (
    <View
      style={{
        height: 56, // altura fija tipo appbar
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        backgroundColor: '#fff',
      }}
    >
      {/* Título a la izquierda */}
      <Text style={{ fontSize: 18, fontWeight: '600' }}>{title}</Text>

      {/* Slot + campana */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {right}

        <Pressable
          onPress={onPressBell}
          style={{ marginLeft: 16, padding: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Notificaciones"
        >
          <Bell size={22} color="#333" />
          {notifications > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
                backgroundColor: '#e11d48',
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
                {notifications > 99 ? '99+' : notifications}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
