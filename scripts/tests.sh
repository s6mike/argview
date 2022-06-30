echo 'Attempting to delete old test outputs.'
# todo Delete old gdrive file
# 1uU7_yfAwMPV3a0lxpiXoVR-m0hbX2Pzs
# Though may not be consistently same name anyway, would need to create with fix name
rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.yml
rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup

a2m Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml
m2a Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup
a2mu Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml
a2mo Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml

echo 'All tests complete.'