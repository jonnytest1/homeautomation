
#include "time.h"
#include <Arduino.h>

inline void printLocalTime()
{
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo))
    {
        Serial.println("Failed to obtain time");
        return;
    }
    Serial.println(&timeinfo, "%A, %B %d %Y %H:%M:%S");
    Serial.print("Day of week: ");
    Serial.println(&timeinfo, "%A");
    Serial.print("Month: ");
    Serial.println(&timeinfo, "%B");
    Serial.print("Day of Month: ");
    Serial.println(&timeinfo, "%d");
    Serial.print("Year: ");
    Serial.println(&timeinfo, "%Y");
    Serial.print("Hour: ");
    Serial.println(timeinfo.tm_hour);
    Serial.print("Hour (12 hour format): ");
    Serial.println(&timeinfo, "%I");
    Serial.print("Minute: ");
    Serial.println(&timeinfo, "%M");
    Serial.print("Second: ");
    Serial.println(&timeinfo, "%S");

    Serial.println("Time variables");
    char timeHour[3];
    strftime(timeHour, 3, "%H", &timeinfo);
    Serial.println(timeHour);
    char timeWeekDay[10];
    strftime(timeWeekDay, 10, "%A", &timeinfo);
    Serial.println(timeWeekDay);
    Serial.println();
}

inline const char *ntpServer = "pool.ntp.org";
inline const char *europeBerlin = "CET-1CEST,M3.5.0,M10.5.0/3";

inline void initTime()
{

    struct tm timeinfo;
    ESP_LOGI(L_TAG, "Setting up time");
    configTime(0, 0, ntpServer);
    if (!getLocalTime(&timeinfo))
    {
        ESP_LOGI(L_TAG, "  Failed to obtain time");
        return;
    }
    String timezone = europeBerlin;
    ESP_LOGI(L_TAG, "  Setting Timezone to %s", timezone.c_str());
    setenv("TZ", timezone.c_str(), 1); //  Now adjust the TZ.  Clock settings are adjusted to show the new local time
    tzset();
}