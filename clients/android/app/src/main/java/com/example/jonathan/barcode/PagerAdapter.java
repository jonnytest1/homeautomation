package com.example.jonathan.barcode;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;

public class PagerAdapter extends FragmentStateAdapter {

    public PagerAdapter(@NonNull FragmentActivity fm) {
        super(fm);
    }
    @NonNull
    @Override
    public Fragment createFragment(int position) {
        if(position==0){
            return new ScannerFragment();
        }else{
            return new SecondFragment();
        }
    }

    @Override
    public int getItemCount() {
        return 2;
    }
}
