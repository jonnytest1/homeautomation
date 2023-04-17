#ifndef CSTM_STR
#define CSTM_STR

#include <vector>
#include "arduino-ref.h"

std::vector<String> string_split(String str, String needle);
int stoi(String str);
bool isNumeric(String str);
#endif