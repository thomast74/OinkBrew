#include "PID.h"
#include "spark_wiring_ticks.h"

/*Constructor (...)*********************************************************
 *    The parameters specified here are those for for which we can't set up
 *    reliable defaults, so we need to have the user set them.
 ***************************************************************************/
PID::PID(float *Input, float *Output, float *Setpoint,
         float Kp, float Ki, float Kd,
         int ControllerDirection)
{
    this->myOutput = Output;
    this->myInput = Input;
    this->mySetpoint = Setpoint;
    this->inAuto = false;

    PID::SetOutputLimits(0, 100); //default output limit corresponds to
                                  //the arduino pwm limits

    SampleTime = 1000; //default Controller Sample Time is 1 seconds

    PID::SetControllerDirection(ControllerDirection);
    PID::SetTunings(Kp, Ki, Kd);

    lastTime = millis() - SampleTime;
}

/* Compute() **********************************************************************
 *     This, as they say, is where the magic happens.  this function should be called
 *   every time "void loop()" executes.  the function will decide for itself whether a new
 *   pid Output needs to be computed.  returns true when the output is computed,
 *   false when nothing has been done.
 **********************************************************************************/
bool PID::Compute()
{
    if (!inAuto)
        return false;

    unsigned long now = millis();
    unsigned long timeChange = (now - lastTime);

    if (timeChange >= SampleTime)
    {
        Update();

        return true;
    }
    else
        return false;
}

void PID::Update()
{
    // Compute all the working error variables
    float input = *myInput;

    if (lastInput == 0.0)
        lastInput = input;

    float error = *mySetpoint - input;
    float delta = input - lastInput;
    integral = integral + (this->ki * error);

    if (integral > outMax)
        integral = outMax;
    else if (integral < outMin)
        integral = outMin;

    // calculate PID parts.
    float p = this->kp * error;
    float i = integral;
    float d = this->kd * delta;

    float pidResult = p + i + d;
    float output = pidResult;

    if (output > outMax)
        output = outMax;
    else if (output < outMin)
        output = outMin;

    *myOutput = output;

    /*
	String debug("input: ");
	debug.concat(input);
	debug.concat(" ; error: ");
	debug.concat(error);
	debug.concat(" ; delta: ");
	debug.concat(delta);
	debug.concat(" ; p: ");
	debug.concat(p);
	debug.concat(" ; i: ");
	debug.concat(i);
	debug.concat(" ; d: ");
	debug.concat(d);
	debug.concat(" ; output: ");
	debug.concat(*myOutput);
	debug.concat(" ; pidResult: ");
	debug.concat(pidResult);
	Log.Info(debug.c_str());
	*/

    /*Remember some variables for next time*/
    lastInput = input;
    lastTime = millis();
}

/* SetTunings(...)*************************************************************
 * This function allows the controller's dynamic performance to be adjusted.
 * it's called automatically from the constructor, but tunings can also
 * be adjusted on the fly during normal operation
 ******************************************************************************/
void PID::SetTunings(float Kp, float Ki, float Kd)
{
    dispKp = Kp;
    dispKi = Ki;
    dispKd = Kd;

    if (controllerDirection == PID_REVERSE)
    {
        this->kp = (0 - Kp);
        this->ki = (0 - Ki);
        this->kd = (0 - Kd);
    }
    else
    {
        this->kp = Kp;
        this->ki = Ki;
        this->kd = Kd;
    }

    this->ka = 5.0 * this->kp;
}

/* SetSampleTime(...) *********************************************************
 * sets the period, in Milliseconds, at which the calculation is performed
 ******************************************************************************/
void PID::SetSampleTime(int NewSampleTime)
{
    if (NewSampleTime > 0)
    {
        SampleTime = (unsigned long)NewSampleTime;
    }
}

/* SetOutputLimits(...)****************************************************
 *     This function will be used far more often than SetInputLimits.  while
 *  the input to the controller will generally be in the 0-1023 range (which is
 *  the default already,)  the output will be a little different.  maybe they'll
 *  be doing a time window and will need 0-8000 or something.  or maybe they'll
 *  want to clamp it from 0-125.  who knows.  at any rate, that can all be done
 *  here.
 **************************************************************************/
void PID::SetOutputLimits(float Min, float Max)
{
    if (Min >= Max)
        return;

    outMin = Min;
    outMax = Max;

    if (inAuto)
    {
        if (*myOutput > outMax)
            *myOutput = outMax;
        else if (*myOutput < outMin)
            *myOutput = outMin;
    }
}

/* SetMode(...)****************************************************************
 * Allows the controller Mode to be set to manual (0) or Automatic (non-zero)
 * when the transition from manual to auto occurs, the controller is
 * automatically initialized
 ******************************************************************************/
void PID::SetMode(int Mode)
{
    bool newAuto = (Mode == PID_AUTOMATIC);
    if (newAuto == !inAuto)
    { /*we just went from manual to auto*/
        PID::Initialize();
    }
    inAuto = newAuto;
}

/* Initialize()****************************************************************
 *	does all the things that need to happen to ensure a bumpless transfer
 *  from manual to automatic mode.
 ******************************************************************************/
void PID::Initialize()
{
    integral = *myOutput;
    lastInput = *myInput;

    if (*myOutput > outMax)
        *myOutput = outMax;
    else if (*myOutput < outMin)
        *myOutput = outMin;
}

/* SetControllerDirection(...)*************************************************
 * The PID will either be connected to a DIRECT acting process (+Output leads
 * to +Input) or a REVERSE acting process(+Output leads to -Input.)  we need to
 * know which one, because otherwise we may increase the output when we should
 * be decreasing.  This is called from the constructor.
 ******************************************************************************/
void PID::SetControllerDirection(int Direction)
{
    if (inAuto && Direction != controllerDirection)
    {
        kp = (0 - kp);
        ki = (0 - ki);
        kd = (0 - kd);
    }
    controllerDirection = Direction;
}

/* Status Funcions*************************************************************
 * Just because you set the Kp=-1 doesn't mean it actually happened.  these
 * functions query the internal state of the PID.  they're here for display
 * purposes.  this are the functions the PID Front-end uses for example
 ******************************************************************************/
float PID::GetKp() { return dispKp; }
float PID::GetKi() { return dispKi; }
float PID::GetKd() { return dispKd; }
int PID::GetMode() { return inAuto ? PID_AUTOMATIC : PID_MANUAL; }
int PID::GetDirection() { return controllerDirection; }
