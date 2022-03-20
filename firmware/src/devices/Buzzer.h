
#pragma once

#include "../config/ShieldSpark.h"
#include "spark_wiring.h"
#include <stdint.h>

class Buzzer
{
private:
    bool active;

public:
    Buzzer()
    {
        pinMode(BUZZER_PIN, OUTPUT);
        active = false;
    }

    void beep(uint8_t numBeeps, uint16_t duration)
    {
        pinMode(BUZZER_PIN, OUTPUT);
        for (uint8_t beepCount = 0; beepCount < numBeeps; beepCount++)
        {
            ShieldSpark spark = ShieldSpark::getInstance();
            u_int8_t value = spark.isV2() ? HIGH : LOW;

            digitalWrite(BUZZER_PIN, value);
            delay(duration);
            digitalWrite(BUZZER_PIN, !value);

            if (beepCount < numBeeps - 1)
            {
                delay(duration);
            }
        }
    }

    void setActive(bool active)
    {
        if (active != this->active)
        {
            this->active = active;
            ShieldSpark spark = ShieldSpark::getInstance();
            u_int8_t value = spark.isV2() ? HIGH : LOW;
            value = active ? value : !value;
            digitalWrite(BUZZER_PIN, value);
        }
    }

    bool isActive()
    {
        return active;
    }
};
