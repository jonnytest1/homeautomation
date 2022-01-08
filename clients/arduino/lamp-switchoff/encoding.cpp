#include "encoding.h"

using namespace std::__cxx11;

String json(const std::map<String, String> content)
{
    String out = "{";
    std::map<String, String>::const_iterator it = content.begin();
    bool separator = false;
    while (it != content.end())
    {
        if (separator)
        {
            out = out + ",";
        }
        else
        {
            separator = true;
        }
        out = out + "\"" + it->first + "\":\"" + it->second + "\" \n ";
        it++;
    }
    return out + "}";
}

String base64_encode(const String &in)
{

    string out;

    int val = 0, valb = -6;
    for (char c : in)
    {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0)
        {
            out.push_back("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6)
        out.push_back("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[((val << 8) >> (valb + 8)) & 0x3F]);
    while (out.size() % 4)
        out.push_back('=');
    return out.c_str();
}
