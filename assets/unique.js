$(document).ready(function () {
  $(document).on("click", ".t4s-btn-coupon", function () {
    let text = $(this).data("coupon");
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    navigator.permissions
      .query({ name: "clipboard-write" })
      .then(function (result) {
        if (result.state == "granted") {
          navigator.clipboard.writeText(textarea.value);
        } else {
          document.execCommand("copy");
        }
      });
    document.body.removeChild(textarea);
    // await navigator.clipboard
    //   .writeText(text)
    //   .then(() => {
    //     console.log("success");
    //   })
    //   .catch((err) => {
    //     console.log("failed :" + err);
    //   });
    $(this)
      .find(".tooltiptext")
      .text(T4Sstrings.copied_tooltipText + ": " + text);
  });
  $(document).on("mouseleave", ".t4s-btn-coupon", function () {
    $(this).find(".tooltiptext").text(T4Sstrings.copy_tooltipText);
  });
});
