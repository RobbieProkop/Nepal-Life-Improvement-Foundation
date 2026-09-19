// Smooth Scrolling
$("#navbar a, .btn").on("click", function (e) {
  if (this.hash !== "") {
    e.preventDefault();

    const hash = this.hash;

    $("html, body").animate(
      {
        scrollTop: $(hash).offset().top - 100,
      },
      800
    );
  }
});

// drop down for donation

$(function () {
  $("#time").selectmenu();

  $("#files").selectmenu();

  $("select[name=time]").selectmenu({ width: "auto" });

  $("input[type=radio]").checkboxradio();

  $("input[type=radio]").checkboxradio({ width: "auto" });
});

$(function () {
  $("#time").selectmenu();

  $("#files").selectmenu();
});
