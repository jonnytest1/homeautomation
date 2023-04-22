

#include <vector>
#include "arduinoref.h"
#include <sstream>
#include <string>
#include <iostream>
std::vector<String> string_split(String search, String delimiter)
{
    std::string s = search.c_str();
    size_t pos_start = 0,
           pos_end, delim_len = delimiter.length();
    std::string token;
    std::vector<String> res;

    while ((pos_end = s.find(delimiter.c_str(), pos_start)) != std::string::npos)
    {
        token = s.substr(pos_start, pos_end - pos_start);
        pos_start = pos_end + delim_len;
        res.push_back(token.c_str());
    }

    res.push_back(s.substr(pos_start).c_str());
    return res;
}

int stoi(String str)
{
    std::stringstream ss;
    int num;
    std::string strVal = str.c_str();
    ss << strVal;
    ss >> num;

    return num;
}

bool isWhitespace(char str)
{
    int charcode = int(str);
    return charcode == 10 || charcode == 32;
}

bool isNumeric(String str)
{
    for (std::string::size_type i = 0; i < str.length(); i++)
    {
        char character = str[i];
        int charcode = int(character);
        if ((charcode < 48 || charcode >= 58))
        {
            return false;
        }
    }
    return true;
}

std::string str_replace_all(std::string container, std::string first, std::string with)
{
    size_t start_pos = container.find(first);
    while (start_pos != std::string::npos)
    {
        container = container.replace(start_pos, first.length(), with);
        start_pos = container.find(first);
    }
    return container;
}

std::string sub_string(std::string str, int start, int end)
{
    return str.substr(start, end - start);
}