"""
Translations for API error messages and responses.
Supports English (en) and German (de).
"""

TRANSLATIONS = {
    "en": {
        "login_success": "You have been logged in successfully.",
        "login_failed": "Your login details are incorrect. Please check and try again.",
        "session_expired": "Your session has expired. Please log in again.",
        "no_permission": "You do not have permission to do this.",
        "missing_credentials": "Please provide both your username and password.",
        "token_required": "You need to log in first to use this feature.",
        "invalid_token": "Your session is not valid. Please log in again.",
        "transfer_success": "The tool has been successfully moved to the selected country.",
        "tool_not_found": "The selected tool could not be found. It may have already been moved.",
        "tool_not_available": "This tool is not available for transfer right now.",
        "invalid_country": "The selected country is not valid. Please choose a different one.",
        "no_tools_selected": "Please select at least one tool to transfer.",
        "transfer_partial": "{success} tool(s) transferred successfully, {failed} failed.",
        "server_error": "Something went wrong. Please try again in a moment.",
        "success": "Done!",
    },
    "de": {
        "login_success": "Sie haben sich erfolgreich angemeldet.",
        "login_failed": "Ihre Anmeldedaten sind falsch. Bitte überprüfen Sie diese und versuchen Sie es erneut.",
        "session_expired": "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
        "no_permission": "Sie haben keine Berechtigung für diese Aktion.",
        "missing_credentials": "Bitte geben Sie sowohl Ihren Benutzernamen als auch Ihr Passwort ein.",
        "token_required": "Sie müssen sich zuerst anmelden, um diese Funktion zu nutzen.",
        "invalid_token": "Ihre Sitzung ist ungültig. Bitte melden Sie sich erneut an.",
        "transfer_success": "Das Werkzeug wurde erfolgreich in das ausgewählte Land übertragen.",
        "tool_not_found": "Das ausgewählte Werkzeug konnte nicht gefunden werden. Möglicherweise wurde es bereits übertragen.",
        "tool_not_available": "Dieses Werkzeug steht derzeit nicht für eine Übertragung zur Verfügung.",
        "invalid_country": "Das ausgewählte Land ist ungültig. Bitte wählen Sie ein anderes.",
        "no_tools_selected": "Bitte wählen Sie mindestens ein Werkzeug für die Übertragung aus.",
        "transfer_partial": "{success} Werkzeug(e) erfolgreich übertragen, {failed} fehlgeschlagen.",
        "server_error": "Etwas ist schiefgelaufen. Bitte versuchen Sie es in Kürze erneut.",
        "success": "Abgeschlossen!",
    }
}


def get_message(key, lang="en", **kwargs):
    """
    Get a translated message by key.
    Falls back to English if the key is missing in the requested language.
    Supports format placeholders via kwargs.
    """
    lang = lang if lang in TRANSLATIONS else "en"
    messages = TRANSLATIONS[lang]
    message = messages.get(key, TRANSLATIONS["en"].get(key, key))

    if kwargs:
        try:
            message = message.format(**kwargs)
        except (KeyError, IndexError):
            pass

    return message
