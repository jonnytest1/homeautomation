/*define Wandlampe_1 dummy
attr Wandlampe_1 room Wohn-Ess
attr Wandlampe_1 setList on off

define Wandlampe_2 dummy
attr Wandlampe_2 room Wohn-Ess
attr Wandlampe_2 setList on off

define Wandlampe_3 dummy
attr Wandlampe_3 room Wohn-Ess
attr Wandlampe_3 setList on off

define Wandlampe_4 dummy
attr Wandlampe_4 room Wohn-Ess
attr Wandlampe_4 setList on off

define Wandlampe_D dummy
attr Wandlampe_D room Wohn-Ess
attr Wandlampe_D setList on off

define Wandlampe_M dummy
attr Wandlampe_M room Wohn-Ess
attr Wandlampe_M setList on off

define taste_1_An notify Wandlampe_1:on {fhem("set CUL_0 freq 433.92 ;; set CUL_0 raw G00f0f153292953000110001100011000110001100011 ;; set CUL_0 freq 868.35") }

define taste1Aus notify Wandlampe_1:off {fhem("set CUL_0 freq 433.92 ;; set CUL_0 raw G00f0f153292953000000000000000000000000000000 ;; set CUL_0 freq 868.35") }

define taste_2_An notify Wandlampe_2:on {fhem("set CUL_0 freq 433.92 ;; set CUL_0 raw G00f0f153292953000930009300093000930009300093 ;; set CUL_0 freq 868.35") }

define taste2Aus notify Wandlampe_2:off {fhem("set CUL_0 freq 433.92 ;; set CUL_0 raw G00f0f153292953000820008200082000820008200082 ;; set CUL_0 freq 868.35") }

define taste_3_An notify Wandlampe_3:on {fhem("set CUL_0 freq 433.92 ;; set CUL_0 raw G00f0f153292953000500005000050000500005000050 ;; set CUL_0 freq 868.35") }

define taste3Aus notify Wandlampe_3:off {fhem("set CUL_0 freq 433.92 ;; set CUL_0 raw G00f0f153292953000410004100041000410004100041 ;; set CUL_0 freq 868.35") }

define taste_4_An notify Wandlampe_4:on {fhem("set CUL_0 freq 433.92 ;; set CUL_0 raw G00f0f1532929530004b0004b0004b0004b0004b0004b ;; set CUL_0 freq 868.35") }

define taste4Aus notify Wandlampe_4:off {fhem("set CUL_0 freq 433.92 ;; set CUL_0 raw G00f0f153292953000c3000c3000c3000c3000c3000c3 ;; set CUL_0 freq 868.35") }

define taste_M_An notify Wandlampe_M:on {fhem("set CUL_0 freq 433.92 ;; set CUL_0 raw G00f0f153292953000f0000f0000f0000f0000f0000f0 ;; set CUL_0 freq 868.35") }

define tasteMAus notify Wandlampe_M:off {fhem("set CUL_0 freq 433.92 ;; set CUL_0 raw G00f0f153292953000e1000e1000e1000e1000e1000e1 ;; set CUL_0 freq 868.35") }

define taste_D_An notify Wandlampe_D:on {fhem("set CUL_0 freq 433.92 ;; set CUL_0 raw G00f0f153292953000c9000c9000c9000c9000c9000c9 ;; set CUL_0 freq 868.35") }

define tasteDAus notify Wandlampe_D:off {fhem("set CUL_0 freq 433.92 ;; set CUL_0 raw G00f0f153292953000d8000d8000d8000d8000d8000d8 ;; set CUL_0 freq 868.35") }
*/
//Wandlampe_D ist Dimmen für Lampe 1, die anderen Codes fürs Dimmen kann man aus dem Link entnehmen. Taste 3 und 4 sind bei mir umgekehrt zu dem Link, bitte beachten.*/
