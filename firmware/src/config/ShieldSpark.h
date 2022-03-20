#ifndef OINKBREW_SHIELDSPARK_H_
#define OINKBREW_SHIELDSPARK_H_

#include <stdio.h>

#define ONE_WIRE_PIN 0
#define ACTUATOR_PIN_1 10
#define ACTUATOR_PIN_2 11
#define ACTUATOR_PIN_3 16
#define ACTUATOR_PIN_4 17
#define BUZZER_PIN 12

class ShieldSpark
{
public:
    static ShieldSpark &getInstance()
    {
        static ShieldSpark instance;
        return instance;
    }

private:
    ShieldSpark();

public:
    void setupVariable();

    int getShieldVersion();
    bool isV1();
    bool isV2();
};

#endif /* OINKBREW_SHIELDSPARK_H_ */
