int   TestVar =   5  ;

event void  FEventExample ( UObject Object,  float Value);
delegate  bool FDelegateExample(FVector& OutLocation) ;

void TestFunc() {
}

  float  TestFunc2   (  int   arg )   {}

 class  Class  :  ParentClass{
  FName  TestVar1  =  n"Hello  World" ;

  access Internal = private,UObject;

  access:Internal
	float PrivateFloatValue=0.0;
	

  access EditAndReadOnly  =  private, * ( editdefaults,readonly);

UPROPERTY (NotEditable,  BlueprintReadOnly,Category="Test", meta=( DisplayName="TestVar2"))
		protected FVector  TestVar2  = FVector ( 1 , 2,3 )  ;

	UFUNCTION( BlueprintCallable,  Category =  "Test")
   private void TestFunc3(FVector & TestVar3, const  FHitResult&in   HitResultIn, FHitResult &out HitResultOut) {
   // Comment
	if ( TestVar1 == 5 ) {
		TestVar1 = 10;
	} else  { Print( f"{TestVar1}" );}}


	private void PrivateFunc()
	{  }


	protected void ProtectedFunc(){

	}


FRotator TestRotator=FRotator(0.0,0.0,0.0);

}