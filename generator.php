<?php
################################
#  GEOMETRIA OBLICZENIOWA 2008 #
#  Projekt 2.                  #
################################

#########################
# przygotowanie danych
#########################

$A = array();
$O = array();
$R = (isset($_POST['R'])) ? $_POST['R'] : 100;

$aArcs = explode('|',$_POST['arcs']);
foreach($aArcs as $arc) $A[] = explode(',',$arc);
$aCircles = explode('|',$_POST['circles']);
foreach($aCircles as $circle) $O[] = explode(',',$circle);

#########################
# skalowanie dla PSa
#########################

$Xmin = $Xmax = $O[0][0];
$Ymin = $Ymax = $O[0][1];
$maxWidth = $maxHeight = 0;

$PAGEWIDTH  = 500;
$PAGEHEIGHT = 550;

foreach($O as $circle){
    if($circle[0]<$Xmin) $Xmin = $circle[0];
    if($circle[0]>$Xmax) $Xmax = $circle[0];
    if($circle[1]<$Ymin) $Ymin = $circle[1];
    if($circle[1]>$Ymax) $Ymax = $circle[1];
}

$maxWidth  = $Xmax - $Xmin + $R + $R;
$maxHeight = $Ymax - $Ymin + $R + $R;

# sprawdz czy sie zmiesci na kartce
$scale = ($maxHeight>$maxWidth) ? $PAGEHEIGHT/$maxHeight : $PAGEWIDTH/$maxWidth;

# normalizuj punkty i skaluj
foreach($A as $i=>$arc){
    $A[$i][0] = ($arc[0]-$Xmin+$R)*$scale;
    $A[$i][1] = ($arc[1]-$Ymin+$R)*$scale;
    $A[$i][2] = ($arc[2]-$Xmin+$R)*$scale;
    $A[$i][3] = ($arc[3]-$Ymin+$R)*$scale;
    $A[$i][4] = ($arc[4]-$Xmin+$R)*$scale;
    $A[$i][5] = ($arc[5]-$Ymin+$R)*$scale;
}
foreach($O as $i=>$circle){
    $O[$i][0] = ($circle[0]-$Xmin+$R)*$scale;
    $O[$i][1] = ($circle[1]-$Ymin+$R)*$scale;
}
$R = $R*$scale;

# zaokraglanie wynikow
foreach($A as $i=>$arc)
   for($j=0;$j<8;$j++)
      $A[$i][$j] = round($arc[$j],6);

foreach($O as $i=>$cir)
   for($j=0;$j<2;$j++)
      $O[$i][$j] = round($cir[$j],6);
      
$R = round($R,5);      

###############################
# przygotowanie danych dla PS
###############################

$output = <<< EOD
/myLine  { newpath moveto lineto stroke }def
/myArc   { newpath arc stroke }def
/myCircle{ newpath $R 0 360 arc stroke }def


EOD
;

foreach($A as $arc){
    $output .= $arc[0].' '.$arc[1].' '.$R.' '.$arc[6].' '.$arc[7]." myArc\n";
}
$output .= "\n";
for($i=0,$ii=sizeof($A);$i<$ii;$i++){
    $output .= $A[$i][4].' '.$A[$i][5].' '.round($A[($i+1)%$ii][2],5).' '.round($A[($i+1)%$ii][3],5)." myLine\n";
}
$output .= "\n";
foreach($O as $cir){
    $output .= $cir[0].' '.$cir[1]." myCircle\n";
}

#########################
# zapis do pliku PS
#########################
/*
$fp = fopen('geometria.ps','w');
flock($fp, 2);
fwrite($fp, $output);
flock($fp, 3);
fclose($fp);
*/ 

echo 'OK***'.$output;