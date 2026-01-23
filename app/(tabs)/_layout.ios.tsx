
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="dashboard" name="dashboard">
        <Icon sf="house.fill" />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="rankings" name="rankings">
        <Icon sf="chart.bar.fill" />
        <Label>Rankings</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="account" name="account">
        <Icon sf="person.fill" />
        <Label>Account</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
