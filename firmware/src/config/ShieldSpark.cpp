#include "ShieldSpark.h"
#include "Particle.h"
#include "spark_wiring.h"

const int BREWPI_SHIELD_SPARK_V1 = 1;
const int BREWPI_SHIELD_SPARK_V2 = 2;

ShieldSpark::ShieldSpark() {}

void ShieldSpark::setupVariable()
{
    Particle.variable("ShieldVersion", [this]()
                      { return this->getShieldVersion(); });
}

int ShieldSpark::getShieldVersion()
{
    static int shieldVersion = 255;

    // only auto-detect once
    if (shieldVersion == 255)
    {
        // V2 has a pull down resistor on the alarm pin
        // V1 has a pull up resistor on the alarm pin
        // If the pin is low, it is V2
        pinMode(BUZZER_PIN, INPUT);
        delay(1);
        if (digitalRead(BUZZER_PIN))
        {
            shieldVersion = BREWPI_SHIELD_SPARK_V1;
        }
        else
        {
            shieldVersion = BREWPI_SHIELD_SPARK_V2;
        }
    }

    return shieldVersion;
}

bool ShieldSpark::isV1()
{
    return getShieldVersion() == BREWPI_SHIELD_SPARK_V1;
}
bool ShieldSpark::isV2()
{
    return getShieldVersion() == BREWPI_SHIELD_SPARK_V2;
}