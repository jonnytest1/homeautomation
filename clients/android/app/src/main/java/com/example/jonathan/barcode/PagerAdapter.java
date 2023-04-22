package com.example.jonathan.barcode;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;

public class PagerAdapter extends FragmentStateAdapter {


    Fragment[] fragments;

    public PagerAdapter(@NonNull FragmentActivity fm) {
        super(fm);
        fragments=new Fragment[]{
                new ScannerFragment(),new SecondFragment(),DebugFragment.newInstance(1)
        };
    }
    @NonNull
    @Override
    public Fragment createFragment(int position) {
        return fragments[position];
    }

    @Override
    public int getItemCount() {
        return fragments.length;
    }
}
