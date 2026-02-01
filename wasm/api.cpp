#include <boost/json/src.hpp>
#include <emscripten.h>
#include <rime_api.h>
#include <string>

#define APP_NAME "rime.react"
#define EMIT_RIME_EVENT(type, value)                                          \
  EM_ASM(onRimeEvent(UTF8ToString($0), JSON.parse(UTF8ToString($1))), (type), \
         to_json(value))

namespace rime_react {

RimeTraits traits = {0};
RimeSessionId session_id;
RimeCommit commit;
RimeContext context;
std::string json_string;
RimeApi* rime = rime_get_api();

template <typename T>
inline const char* to_json(T& obj) {
  json_string = boost::json::serialize(obj);
  return json_string.c_str();
}

void handler(void*, RimeSessionId, const char* type, const char* value) {
  EMIT_RIME_EVENT(type, value);
}

bool start_rime(bool restart) {
  rime->initialize(&traits);
  rime->set_notification_handler(handler, NULL);
  if (restart ? rime->start_maintenance(true) : rime->start_quick()) {
    rime->join_maintenance_thread();
    return true;
  }
  return false;
}

bool stop_rime() {
  if (rime->destroy_session(session_id)) {
    rime->finalize();
    return true;
  }
  return false;
}

void emit_input_status() {
  boost::json::object status;
  if (rime->get_commit(session_id, &commit)) {
    status["committed"] = commit.text;
  }
  rime->free_commit(&commit);
  rime->get_context(session_id, &context);
  RimeComposition& composition = context.composition;
  status["isComposing"] = !!composition.length;
  if (composition.length) {
    std::string preedit = composition.preedit;
    boost::json::object pre_edit;
    pre_edit["before"] = preedit.substr(0, composition.sel_start);
    pre_edit["active"] = preedit.substr(
        composition.sel_start, composition.sel_end - composition.sel_start);
    pre_edit["after"] = preedit.substr(composition.sel_end);
    status["inputBuffer"] = pre_edit;
    RimeMenu& menu = context.menu;
    status["page"] = menu.page_no;
    status["isLastPage"] = !!menu.is_last_page;
    status["highlightedIndex"] = menu.highlighted_candidate_index;
    boost::json::array candidates;
    for (size_t i = 0; i < menu.num_candidates; ++i) {
      boost::json::object candidate;
      candidate["label"] = context.select_labels && context.select_labels[i] &&
                                   *context.select_labels[i]
                               ? context.select_labels[i]
                               : std::to_string((i + 1) % 10) + '.';
      candidate["text"] = menu.candidates[i].text;
      if (menu.candidates[i].comment) {
        candidate["comment"] = menu.candidates[i].comment;
      }
      candidates.push_back(candidate);
    }
    status["candidates"] = candidates;
  }
  rime->free_context(&context);
  EMIT_RIME_EVENT("input", status);
}

extern "C" {

bool init() {
  RIME_STRUCT_INIT(RimeTraits, traits);
  traits.shared_data_dir = "/usr/share/rime-data";
  traits.user_data_dir = "/rime";
  traits.app_name = APP_NAME;
  rime->setup(&traits);
  RIME_STRUCT_INIT(RimeCommit, commit);
  RIME_STRUCT_INIT(RimeContext, context);
  if (start_rime(false)) {
    session_id = rime->create_session();
    rime->set_option(session_id, "soft_cursor", True);
    return true;
  }
  return false;
}

bool process_key(const char* input) {
  Bool success = rime->simulate_key_sequence(session_id, input);
  emit_input_status();
  return success;
}

bool select_candidate(int index) {
  Bool success = rime->select_candidate_on_current_page(session_id, index);
  emit_input_status();
  return success;
}

bool delete_candidate(int index) {
  Bool success = rime->delete_candidate_on_current_page(session_id, index);
  emit_input_status();
  return success;
}

bool flip_page(bool backward) {
  Bool success = rime->change_page(session_id, backward);
  emit_input_status();
  return success;
}

void clear_input() {
  rime->clear_composition(session_id);
  emit_input_status();
}

bool deploy() {
  if (stop_rime() && start_rime(true)) {
    session_id = rime->create_session();
    rime->set_option(session_id, "soft_cursor", True);
    return true;
  }
  return false;
}
}

}  // namespace rime_react
