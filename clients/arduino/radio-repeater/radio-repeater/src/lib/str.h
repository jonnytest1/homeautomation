#ifndef CSTM_STR
#define CSTM_STR

#include <vector>
#include "arduinoref.h"

std::vector<String> string_split(String str, String needle);
int stoi(String str);
bool isNumeric(String str);
bool isWhitespace(char str);
std::string str_replace_all(std::string container, std::string first, std::string with);
std::string sub_string(std::string str, int start, int end);
#endif